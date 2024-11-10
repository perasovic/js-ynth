<Panel heading="SOUND CAPTURE" isOpen={true} removeHandler={() => removeHandler()}>
    <label>
        <input type="checkbox" bind:checked={useEchoCancellation}>
        echo cancellation
    </label>
    <label>
        <input type="checkbox" bind:checked={useNoiseSuppression}>
        noise suppression
    </label>
    <Knob bind:value={silenceTresholdValue} outputValue={silenceTreshold} title="SILENCE LIMIT" max={100} min={1}/>
</Panel>


<script>
    import Panel from '../components/Panel.svelte';
    import Knob from '../components/Knob.svelte';

    export let removeHandler;
    export let useEchoCancellation;
    export let useNoiseSuppression;
    export let silenceTreshold;
    
    let silenceTresholdValue = 10;

    $: {
        silenceTreshold = silenceTresholdValue / 100;
    }
</script>


<style>
    label {
        margin: 0 20px;
    }
</style>
