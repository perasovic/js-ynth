const MIN_DURATION_MS = 200;           // Mindest-Aufnahmedauer
const SILENCE_DURATION_MS = 1000;      // Stille bis Stop
const HYSTERESIS_FACTOR = 1.2;         // 20% höher für Start
const PADDING_DURATION_MS = 100;       // Stille-Puffer vorne und hinten

class SingleSoundProcessor extends AudioWorkletProcessor {

    constructor(options) {
        super();

        this.options = options.processorOptions;
        this.silenceTreshold = this.options.silenceTreshold || 0;
        
        this.startThreshold = this.silenceTreshold * HYSTERESIS_FACTOR;
        this.stopThreshold = this.silenceTreshold;

        // sampleRate is available globally in AudioWorkletGlobalScope
        this.currentSampleRate = typeof sampleRate !== 'undefined' ? sampleRate : 44100;
        this.minSamplesRequired = (this.currentSampleRate * MIN_DURATION_MS) / 1000;
        this.silenceSamplesRequired = (this.currentSampleRate * SILENCE_DURATION_MS) / 1000;
        this.paddingSamples = (this.currentSampleRate * PADDING_DURATION_MS) / 1000;

        console.log('SingleSoundProcessor', options)

        this.port.onmessage = this.onMessage.bind(this);

        this.continueProcessing = true;
        this.soundStarted = false;

        this.samplesX = [];
        this.samplesY = [];
        this.preRecordBufferX = [];
        this.preRecordBufferY = [];

        this.silentSamplesCount = 0;
        this.totalSamplesRecorded = 0;
    }

    onMessage(event) {
        console.log('AudioWorkletProcessor.onMessage:', event.data);
        const { id, data } = event.data;
        switch(id) {
            case 'stop': {
                if (this.continueProcessing) {
                    this.endProcessing();
                }
                break;
            }
            default: {
                console.warn('SingleSoundProcessor: unknown message', event.data);
                break;
            }
        }
    }

    postMessage(id, data) {
        //console.log('AudioWorkletProcessor.postMessage:', data);
        this.port.postMessage({id, data});
    }

    process(inputs, outputs, parameters)
    {
        //console.log('process')
        const input = inputs[0];

        // check data - no input at all may occur occasionally
        if (!input[0]) {
            console.warn('no input')
            return this.continueProcessing;
        }

        // collect 'em all!
        // if input is mono (no input[1]), fallback to input[0] for ySamples
        const xSamples = input[0];
        const ySamples = input[1] || input[0];
        
        const frameCount = ySamples.length;
        
        const absAverage = ySamples.reduce((result, sample) => result + Math.abs(sample), 0) / frameCount;

            if (!this.soundStarted) {
                this.preRecordBufferX.push(...xSamples);
                this.preRecordBufferY.push(...ySamples);
                
                // Keep the rolling buffer within the padding size limit
                if (this.preRecordBufferX.length > this.paddingSamples) {
                    const excess = this.preRecordBufferX.length - this.paddingSamples;
                    this.preRecordBufferX.splice(0, excess);
                    this.preRecordBufferY.splice(0, excess);
                }

                if (absAverage > this.startThreshold) {
                    this.soundStarted = true;
                    this.silentSamplesCount = 0;
                    this.totalSamplesRecorded = this.preRecordBufferX.length;
                    
                    // Prepend the padded samples recorded before the start
                    this.samplesX.push(...this.preRecordBufferX);
                    this.samplesY.push(...this.preRecordBufferY);
                }
            }

            if (this.soundStarted) {
                this.samplesX.push(...xSamples);
                this.samplesY.push(...ySamples);
                this.totalSamplesRecorded += frameCount;

                if (absAverage > this.stopThreshold) {
                    this.silentSamplesCount = 0;
                } else {
                    this.silentSamplesCount += frameCount;
                }

                if (this.totalSamplesRecorded >= this.minSamplesRequired) {
                    if (this.silentSamplesCount >= this.silenceSamplesRequired) {
                        this.endProcessing();
                    }
                }
            }

        return this.continueProcessing;
    }

    resetState() {
        this.samplesX = [];
        this.samplesY = [];
        this.preRecordBufferX = [];
        this.preRecordBufferY = [];
        this.continueProcessing = false;
        this.soundStarted = false;
        this.silentSamplesCount = 0;
        this.totalSamplesRecorded = 0;
    }

    endProcessing() {
        console.log('endProcessing');
        // Trim trailing silence, but leave the padding duration at the end
        const trimCount = Math.max(0, this.silentSamplesCount - this.paddingSamples);
        if (trimCount > 0 && trimCount < this.samplesX.length) {
            this.samplesX.splice(this.samplesX.length - trimCount, trimCount);
            this.samplesY.splice(this.samplesY.length - trimCount, trimCount);
        }

        const {samplesX, samplesY} = this;
        this.postMessage('soundData', {samplesX, samplesY});
        this.resetState();
    }
}

registerProcessor('single-sound-processor', SingleSoundProcessor);