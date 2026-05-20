<Oscillator bind:frequency={frequency} bind:waveType={waveType} disabled={!lfoActive} maxFrequency={200} minFrequency={1} enableInverseFrequency={true}>
    <Knob slot="knob3" bind:value={depth} title="DEPTH" unit="" max={100} min={1}/>
    <label slot="label">
        <input type="checkbox" bind:checked={lfoActive}>
        <Tooltip text="Low Frequency Oscillator - modulates the main sound over time">LFO</Tooltip>
    </label>
</Oscillator>

<script>
    import Oscillator from './OscillatorControls.svelte';
    import Knob from '../../components/Knob.svelte';
    import Tooltip from '../../components/Tooltip.svelte';

    // getters
    export let lfoActive;
    export let waveType;
    export let frequency;
    export let depth;

</script>
