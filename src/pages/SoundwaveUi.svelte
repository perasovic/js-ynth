<div class="layout">
    <div class="left-column">
        <Oscilloscope bind:sampleSize={sampleSize} bind:oldWavesDisplayed={oldWavesDisplayed} bind:fps={fps} />
    </div>
    <div class="right-column">
        {#if errorMessage}
            <div class="errorMsg">{errorMessage}</div>
        {/if}
        <div class="button-group">
            <button 
                class="primary-action {isSoundPlaying ? 'is-playing' : ''}" 
                on:click={toggleSound}>
                {#if isSoundPlaying}
                    <span class="status-dot"></span> stop sound
                {:else}
                    play sound
                {/if}
            </button>
            <button on:click={addSound}>
                add a sound
            </button>
            <button 
                class="{isCapturing ? 'is-recording' : ''} {captureCountdown ? 'is-countdown' : ''}" 
                on:click={toggleCapture}>
                {#if isCapturing}
                    <span class="status-dot recording"></span> stop capture
                {:else if captureCountdown}
                    <span class="countdown-number">{captureCountdown}</span> capture in...
                {:else}
                    capture sound
                {/if}
            </button>
            <button 
                class="{isInputActive ? 'is-active' : ''}" 
                on:click={toggleAudioInput}>
                {#if isInputActive}
                    <span class="status-dot active"></span> stop input
                {:else}
                    get input
                {/if}
            </button>
        </div>
        {#if isInputActive}
            <AudioInput bind:useEchoCancellation={useEchoCancellation} bind:useNoiseSuppression={useNoiseSuppression} removeHandler={stopAudioInput} />
        {/if}
        {#if showSoundCapture}
            <SoundCapture bind:useEchoCancellation={useEchoCancellation} bind:useNoiseSuppression={useNoiseSuppression} bind:silenceTreshold={silenceTreshold} removeHandler={() => {showSoundCapture = false;}} />
        {/if}
        {#each sounds as sound}
            <SoundwaveControls bind:sound={sound} removeHandler={() => removeSound(sound)} />
        {/each}
    </div>
</div>

<script>
    import {onMount, onDestroy} from 'svelte';
    import AudioInput from '../modules/AudioInput.svelte';
    import SoundCapture from '../modules/SoundCapture.svelte';
    import SoundwaveControls from '../modules/soundwave/SoundwaveControls.svelte';
    import Sound from '../utils/Sound';
    import Oscilloscope, { drawWaveCallback, drawSoundCallback } from '../modules/oscilloscope/Oscilloscope.svelte';
    import {
        init as initSoundsystem, 
        startSound as startPlayingSound,
        stopSound as stopPlayingSound,
        startAudioInput as startAudioInputProcessing,
        startAudioCapture,
        stopAudioInput as stopAudioInputProcessing,
        setProcessorFps,
        setProcessorSweepTime,
    } from '../utils/soundsystem';

    let isSoundPlaying = false;
    let isInputActive = false;
    let isCapturing = false;
    let showSoundCapture = false;
    let captureCountdown = 0;
    let captureCountdownTimeout = null;
    let stopSoundTimeout = null;
    let useEchoCancellation = false;
    let useNoiseSuppression = true;
    let silenceTreshold = 0;
    let sampleSize = 0.1;
    let fps = 60;
    let oldWavesDisplayed = 10;
    let errorMessage = null;

    let sounds = [];

    onMount(() => {
        initSoundsystem(drawWaveCallback, onDrawSound, errorCallback);
        sounds = sounds.concat(new Sound());
    });

    onDestroy(() => {
        clearTimeout(stopSoundTimeout);
    });

    // reactive stuff
    $: isSoundPlaying ? startSound() : stopSound();
    $: setProcessorSweepTime(sampleSize);
    $: setProcessorFps(fps);
    $: updateAudioInput(useEchoCancellation, useNoiseSuppression);  // pass unused params to enable reactivity
    //

    function toggleAudioInput() {
        errorMessage = null;

        if (isInputActive) {
            stopAudioInput();
        }
        else {
            startAudioInput();
        }
    }

    function startAudioInput() {
        startAudioInputProcessing(useEchoCancellation, useNoiseSuppression)
                .then(() => {
                    isInputActive = true;
                })
                .catch(error => {
                    console.error('cannot get user audio', {error});
                    errorMessage = 'cannot get audio input';
                    isInputActive = false;
                });
    }

    function stopAudioInput() {
        stopAudioInputProcessing();
        isInputActive = false;
    }

    function updateAudioInput() {
        if (isInputActive) {
            startAudioInput();
        }
    }

    function toggleSound() {
        errorMessage = null;
        isSoundPlaying = !isSoundPlaying;
    }

    function startSound() {
        startPlayingSound();
        setProcessorSweepTime(sampleSize);
        setProcessorFps(fps);
        sounds.forEach(sound => sound.play());
    }

    function stopSound() {
        sounds.forEach(sound => sound.stop());
        isSoundPlaying = false;
        //TODO: find a timeout without magic number - it seems to be not the sound's release
        //const timeout = Math.max(soundWave.release * 1000, drawInterval);
        const timeout = 600;
        clearTimeout(stopSoundTimeout);
        stopSoundTimeout = setTimeout(() => {
            if (!isSoundPlaying) {
                stopPlayingSound();
            }
        }, timeout);
    }

    function addSound() {
        const sound = new Sound();
        sounds = sounds.concat(sound);

        if (isSoundPlaying) {
            sounds.forEach(sound => sound.stop());
            sounds.forEach(sound => sound.play());
        }
    }

    function removeSound(sound) {
        const index = sounds.indexOf(sound);

        if (index > -1) {
            const { [index]:removedSound, ...remainingSounds } = sounds;
            removedSound.remove();
            sounds = Object.values(remainingSounds);
        }
    }

    function toggleCapture() {
        if (isCapturing) {
            stopCapture();
        }
        else {
            showSoundCapture = true;
            startCaptureCountdown();
        }
    }

    function startCaptureCountdown() {
        clearTimeout(captureCountdownTimeout);
        captureCountdown = 3;
        captureCountdownTimeout = setTimeout(() => captureCountdownStep(), 1000);
    }

    function captureCountdownStep() {
        captureCountdown--;
        if (captureCountdown === 0) {
            startCapture();
        } else {
            captureCountdownTimeout = setTimeout(() => captureCountdownStep(), 1000);
        }
    }

    function startCapture() {
        startAudioCapture(useEchoCancellation, useNoiseSuppression, silenceTreshold)
                .then(() => {
                    isCapturing = true;
                })
                .catch(error => {
                    console.error('cannot get user audio', {error});
                    errorMessage = 'cannot start audio capture';
                    isCapturing = false;
                });
    }

    function stopCapture() {
        stopAudioInputProcessing();
        isCapturing = false;
    }

    function onDrawSound(data) {
        isCapturing = false;
        drawSoundCallback(data);
    }

    function errorCallback(errorType) {
        let message = 'an error occurred.';

        switch(errorType) {
            case 'process': {
                message = 'cannot get audio data. please check your audio system - is your audio used by another app?'
                break;
            }
            default: {
                break;
            }
        }

        errorMessage = message;
    }
</script>


<style>
    .layout {
        display: flex;
        gap: 20px;
        align-items: flex-start;
    }

    .left-column {
        position: sticky;
        top: 0;
        flex-shrink: 0;
    }

    .right-column {
        flex: 1;
        min-width: 0;
        max-width: 600px;
    }

    @media screen and (max-width: 900px) {
        .layout {
            flex-direction: column;
        }
        .left-column {
            position: relative;
            width: 100%;
        }
    }

    .errorMsg {
        margin: 20px 0;
        padding: 12px 16px;
        background-color: #fff3f0;
        border-left: 3px solid #ff3e00;
    }

    .button-group {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        flex-wrap: wrap;
        justify-content: center;
    }

    button {
        background-color: white;
        color: #ff3e00;
        text-align: left;
        border: 1px solid #ff3e00;
        text-transform: uppercase;
        padding: 8px 16px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    button:hover {
        background-color: #fff3f0;
    }

    /* Status-Indikatoren */
    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #ff3e00;
        animation: pulse 1.5s infinite;
    }

    .status-dot.recording {
        background-color: #dc2626;
        animation: pulse 0.8s infinite;
    }

    .status-dot.active {
        background-color: #16a34a;
        animation: none;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.1); }
    }

    /* Aktive Zustände */
    .is-playing {
        background-color: #ff3e00 !important;
        color: white !important;
    }

    .is-recording {
        background-color: #dc2626 !important;
        color: white !important;
        border-color: #dc2626 !important;
    }

    .is-active {
        background-color: #16a34a !important;
        color: white !important;
        border-color: #16a34a !important;
    }

    .is-countdown {
        background-color: #f59e0b !important;
        color: white !important;
        border-color: #f59e0b !important;
    }

    .countdown-number {
        font-weight: bold;
        font-size: 1.1em;
    }

    /* Primär-Aktion */
    .primary-action {
        font-weight: 600;
    }

    .primary-action:not(.is-playing):hover {
        background-color: #fff3f0;
    }
</style>