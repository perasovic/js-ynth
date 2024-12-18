import * as Pizzicato from 'pizzicato';

const sounds = [];

let audioContext;
let limiter;
let preGain;

let isSoundPlaying;
let isAudioInputActive;
let isAudioCaptureActive;
let inputStream;

let processor;
let processorOptions;
let waveDataCallback;
let soundDataCallback;
let processErrorCallback;


async function init(drawWaveCallback, drawSoundCallback, errorCallback) {
    waveDataCallback = drawWaveCallback;
    soundDataCallback = drawSoundCallback;
    processErrorCallback = errorCallback;

    audioContext = Pizzicato.context;

    preGain = createGain();
    limiter = new Pizzicato.Effects.Compressor({
        threshold: -5.0, // decibels
        knee: 0, // decibels
        ratio: 40.0,  // decibels
        attack: 0.001, // seconds
        release: 0.1, // seconds
    });

    processorOptions = {
        mainGain: Pizzicato.masterGainNode.gain.value,
        sampleRate: audioContext.sampleRate,
    }
    await audioContext.audioWorklet.addModule('processors/SoundwaveProcessor.js');
    await audioContext.audioWorklet.addModule('processors/SingleSoundProcessor.js');
}

function createSoundwaveProcessor() {
    const processorNode = new AudioWorkletNode(audioContext, 'soundwave-processor', {processorOptions});
    processorNode.port.onmessage = (e) => {
        //console.log('soundsystem.onmessage', e);
        handleProcessorMessage(e.data);
    }

    return processorNode;
}

function createSingleSoundProcessor(silenceTreshold) {
    const processorNode = new AudioWorkletNode(audioContext, 'single-sound-processor', { processorOptions: {
        ...processorOptions,
        silenceTreshold,
    }});
    processorNode.port.onmessage = (e) => {
        //console.log('soundsystem.onmessage', e);
        handleProcessorMessage(e.data);
    }

    return processorNode;
}

function handleProcessorMessage(message) {
    const { id, data } = message;
    //console.log('handleProcessorMessage', id);
    //console.log(data);
    switch (id) {
        case 'waveData': {
            waveDataCallback(data);
            break;
        }
        case 'soundData': {
            console.log('got soundData', data);
            stopAudioInput();
            soundDataCallback(data);
            break;
        }
        case 'error': {
            processErrorCallback(data);
            break;
        }
        default: {
            console.warn('unknown processor message', message);
            break;
        }
    }
}

function createSound(type, frequency) {
    const sound = createOscillator(type, frequency);
    const soundGain = audioContext.createGain();
    sound.connect(soundGain);
    soundGain.connect(preGain);

    return {sound, soundGain};
}

function createOscillator(type, frequency) {
    const osc = new Pizzicato.Sound({
        source: 'wave',
        options: {
            type,
            frequency,
            detached: true,
        }
    });

    return osc;
}

function removeOscillator(osc) {
    if (osc) {
        osc.off();
        osc.stop();
        osc.disconnect();
    }
}

function assertAudioContextRunning() {
    if (Pizzicato.context.state !== 'running') {
        Pizzicato.context.resume();
    }
}

async function startAudioInput(echoCancellation, noiseSuppression) {
    stopAudioInput();
    assertAudioContextRunning();
    return navigator.mediaDevices.getUserMedia({ audio: {echoCancellation, noiseSuppression} })
        .then(stream => {
            const audioSourceNode = new MediaStreamAudioSourceNode(audioContext, {mediaStream: stream});
            audioSourceNode.connect(limiter);
            startSoundwaveProcessor();
            isAudioInputActive = true;
            inputStream = stream;
            return true;
        });
}

function endAudioInput() {
    isAudioInputActive = false;
    stopSoundwaveProcessor();
    if (inputStream) {
        inputStream.getAudioTracks().forEach(track => {
            track.stop();
        });
        inputStream = null;
    }
}

function stopAudioInput() {
    if (isAudioInputActive) {
        endAudioInput();
    }
    if (isAudioCaptureActive) {
        endAudioCapture();
    }
}

async function startAudioCapture(echoCancellation, noiseSuppression, silenceTreshold) {
    stopAudioInput();
    assertAudioContextRunning();
    console.log('start audio capture', { echoCancellation, noiseSuppression, silenceTreshold });
    return navigator.mediaDevices.getUserMedia({ audio: {echoCancellation, noiseSuppression} })
        .then(stream => {
            const audioSourceNode = new MediaStreamAudioSourceNode(audioContext, {mediaStream: stream});
            audioSourceNode.connect(limiter);
            startSingleSoundProcessor(silenceTreshold);
            isAudioCaptureActive = true;
            inputStream = stream;
            return true;
        });
}

function endAudioCapture() {
    isAudioCaptureActive = false;
    stopSingleSoundProcessor();
    if (inputStream) {
        inputStream.getAudioTracks().forEach(track => {
            track.stop();
        });
        inputStream = null;
    }
}

function startSound() {
    assertAudioContextRunning();
    preGain.connect(limiter);
    startSoundwaveProcessor();
    isSoundPlaying = true;
}

function stopSound() {
    isSoundPlaying = false;
    stopSoundwaveProcessor();
}

function startSingleSoundProcessor(silenceTreshold) {
    if (!processor) {
        console.log('startSingleSoundProcessor with silenceTreshold', silenceTreshold);

        processor = createSingleSoundProcessor(silenceTreshold);

        limiter.connect(processor);
        processor.connect(Pizzicato.masterGainNode);
    }
}

function stopSingleSoundProcessor() {
    if (processor) {
        console.log('stopSingleSoundProcessor');
        processorMessage('stop');
        limiter.disconnect(processor);
        processor.disconnect(Pizzicato.masterGainNode);
        processor = null;
    }
}

function startSoundwaveProcessor() {
    if (!processor) {
        console.log('startSoundwaveProcessor')

        processor = createSoundwaveProcessor();

        limiter.connect(processor);
        processor.connect(Pizzicato.masterGainNode);
    }
}

function stopSoundwaveProcessor() {
    if (processor && !isAudioInputActive && !isSoundPlaying) {
        console.log('stopSoundwaveProcessor');
        processorMessage('stop');
        limiter.disconnect(processor);
        processor.disconnect(Pizzicato.masterGainNode);
        processor = null;
    }
}

function setProcessorSweepTime(time) {
    processorMessage('sweepTime', time);
}

function setProcessorFps(fps) {
    processorMessage('fps', fps);
}

function processorMessage(id, data) {
    if (processor) {
        processor.port.postMessage({id, data});
    }
}

function createGain(options = {}) {
    return new GainNode(audioContext, options);
}

export {
    init,
    createOscillator,
    createSound,
    removeOscillator,
    setProcessorSweepTime,
    setProcessorFps,
    createGain,
    startAudioInput,
    startAudioCapture,
    stopAudioInput,
    startSound,
    stopSound,
}