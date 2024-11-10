<Oscilloscope bind:sampleSize={sampleSize} bind:oldWavesDisplayed={oldWavesDisplayed} bind:fps={fps} />
{#if errorMessage}
    <div class="errorMsg">{errorMessage}</div>
{/if}
<div>
    <button on:click={toggleCapture}>
        {#if isCapturing}
            stop capture
        {:else if captureCountdown}
            capture in {captureCountdown} 
        {:else}
            capture sound
        {/if}
    </button>
    <button on:click={toggleAudioInput}>
        {#if isInputActive}
            stop input
        {:else}
            get input
        {/if}
    </button>
    <button on:click={toggleSound}>
        {#if isSoundPlaying}
            stop sound
        {:else}
            play sound
        {/if}
    </button>
    <button on:click={addSound}>
        add a sound
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

<script>
    import {onMount} from 'svelte';
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
        setTimeout(() => {
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
    .errorMsg {
        margin: 20px 0;
    }

    button {
        background-color: white;
        color: #ff3e00;
        text-align: left;
        border: 1px solid;
        text-transform: uppercase;
    }
</style>