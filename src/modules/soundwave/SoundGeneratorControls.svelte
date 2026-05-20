<Oscillator bind:frequency={frequency} bind:waveType={waveType} maxFrequency={5000} minFrequency={60}>
    <Knob slot="knob3" bind:value={detune} title="DETUNE" unit="cents" max={50} min={-50} />
    <span slot="label">
        <Tooltip text="The main oscillator generating your sound wave">SOUND</Tooltip>
    </span>
</Oscillator>


<script>
    import Oscillator from './OscillatorControls.svelte';
    import Knob from '../../components/Knob.svelte';
    import Tooltip from '../../components/Tooltip.svelte';

    // getters
    export let waveType;
    export let frequency;
    export let detune;
    
</script>
