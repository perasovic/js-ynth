<Oscillator bind:frequency={frequency} bind:waveType={waveType} disabled={!lfoActive} maxFrequency={200} minFrequency={1} enableInverseFrequency={true}>
    <Knob slot="knob3" bind:value={depth} title="DEPTH" unit="" max={100} min={1}/>
    <div slot="label" class="lfo-header">
        <Tooltip text="Low Frequency Oscillator - modulates the main sound over time">LFO</Tooltip>
        <button class="toggle" class:active={lfoActive} on:click={() => lfoActive = !lfoActive}>
            {lfoActive ? 'ON' : 'OFF'}
        </button>
    </div>
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

<style>
    .lfo-header {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .toggle {
        font-size: 0.65rem;
        font-weight: 700;
        padding: 2px 8px;
        border: 1px solid #ccc;
        border-radius: 3px;
        background: #f5f5f5;
        color: #888;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 32px;
    }

    .toggle:hover {
        border-color: #999;
    }

    .toggle.active {
        background: #ff3e00;
        border-color: #ff3e00;
        color: white;
    }
</style>
