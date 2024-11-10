class SingleSoundProcessor extends AudioWorkletProcessor {

    constructor(options) {
        super();

        this.options = options.processorOptions;
        //console.log('SingleSoundProcessor', this.options)

        this.port.onmessage = this.onMessage.bind(this);

        this.continueProcessing = true;
        this.soundStarted = false;

        this.samplesX = [];
        this.samplesY = [];

        this.silentSamples = 0;
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
        const output = outputs[0];

        // copy over input to output to bypass the sound to the next audio node
        for (let channel = 0; channel < output.length; ++channel) {
            const inChannel = input[channel];
            const outChannel = output[channel];

            if (inChannel) {
                for (let i = 0; i < inChannel.length; i++) {
                    outChannel[i] = inChannel[i];
                }
            }
        }

        // check data - no input at all may occur occasionally
        // if we have input[0] but not input[1], there's something wrong
        if (!input[0]) {
            console.warn('no input')
        }
        if (input[0] && !input[1]) {
            console.warn('no ySamples - output busy?');
            this.postMessage('error', 'process');
            this.resetState();
            return false;
        }

        // collect 'em all!
        if (input[0] && input[1]) {
            const xSamples = input[0];
            const ySamples = input[1];
            
            // const maxSample = Array.prototype.reduce.call(ySamples, (result, sample) => Math.abs(sample) > result ? Math.abs(sample) : result, 0);
            // const hasLoudness = ySamples.some((sample) => sample > 0);
            
            const treshold = 0.001;
            const average = ySamples.reduce((result, sample) => result + sample, 0) / ySamples.length;
            const absAverage = ySamples.reduce((result, sample) => result + Math.abs(sample), 0) / ySamples.length;
            
            const singleSampleOverTreshold = ySamples.some((sample) => Math.abs(sample) > treshold);
            const averageOverTreshold = Math.abs(average) > treshold;
            const absAverageOverTreshold = absAverage > treshold;

            // console.log('ysamples', ySamples);
            console.log(`soundStarted: ${this.soundStarted}`, { singleSampleOverTreshold, averageOverTreshold, absAverageOverTreshold, silentSamples: this.silentSamples });

            if (absAverageOverTreshold) {
                this.soundStarted = true;
                this.silentSamples = 0;
            }
            else if (this.silentSamples > 2){
                if (this.soundStarted) {
                    this.endProcessing();
                }
            }
            else {
                this.silentSamples++;
            }

            // to also add silent samples as long as we still capture, do this here
            if (this.soundStarted) {
                this.samplesX.push(...xSamples);
                this.samplesY.push(...ySamples);
            }
        }

        return this.continueProcessing;
    }

    resetState() {
        this.samplesX = [];
        this.samplesY = [];
        this.continueProcessing = false;
        this.soundStarted = false;
        this.silentSamples = 0;
    }

    endProcessing() {
        console.log('endProcessing');
        const {samplesX, samplesY} = this;
        this.postMessage('soundData', {samplesX, samplesY});
        this.resetState();
    }
}

registerProcessor('single-sound-processor', SingleSoundProcessor);