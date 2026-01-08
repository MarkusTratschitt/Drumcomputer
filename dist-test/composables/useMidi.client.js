import { onBeforeUnmount, ref } from 'vue';
import { defaultMidiMapping } from '@/domain/midiMapping';
export function useMidi() {
    const access = ref(null);
    const inputs = ref([]);
    const outputs = ref([]);
    const mapping = ref(defaultMidiMapping());
    const selectedInputId = ref(null);
    const selectedOutputId = ref(null);
    const listeners = ref(new Set());
    let handlePageHide = null;
    let handlePageShow = null;
    const supportsMidi = () => typeof navigator !== 'undefined' && Boolean(navigator.requestMIDIAccess);
    const refreshDevices = () => {
        if (!access.value)
            return;
        inputs.value = Array.from(access.value.inputs.values()).map((device) => ({
            id: device.id,
            name: device.name ?? 'MIDI In',
            type: 'input'
        }));
        outputs.value = Array.from(access.value.outputs.values()).map((device) => ({
            id: device.id,
            name: device.name ?? 'MIDI Out',
            type: 'output'
        }));
    };
    const requestAccess = async () => {
        if (!supportsMidi()) {
            return;
        }
        access.value = await navigator.requestMIDIAccess({ sysex: false });
        refreshDevices();
        if (access.value) {
            access.value.onstatechange = () => {
                refreshDevices();
                attachSelectedInput();
            };
        }
    };
    const handleMidiMessage = (event) => {
        if (!event.data || event.data.length < 1)
            return;
        const status = event.data[0];
        const data1 = event.data[1];
        const data2 = event.data[2];
        if (status === undefined)
            return;
        const type = status & 0xf0;
        const hasNoteData = typeof data1 === 'number' && typeof data2 === 'number';
        const message = type === 0x90 && hasNoteData && data2 > 0
            ? { type: 'noteon', note: data1, velocity: data2 / 127 }
            : type === 0x80 && hasNoteData
                ? { type: 'noteoff', note: data1, velocity: data2 / 127 }
                : type === 0x90 && hasNoteData && data2 === 0
                    ? { type: 'noteoff', note: data1, velocity: data2 / 127 }
                    : status === 0xf8
                        ? { type: 'clock' }
                        : status === 0xfa
                            ? { type: 'start' }
                            : status === 0xfc
                                ? { type: 'stop' }
                                : null;
        if (!message)
            return;
        listeners.value.forEach((cb) => cb(message));
    };
    const detachInputs = () => {
        access.value?.inputs.forEach((input) => {
            input.onmidimessage = null;
        });
    };
    const attachSelectedInput = () => {
        detachInputs();
        if (!selectedInputId.value)
            return;
        const input = access.value?.inputs.get(selectedInputId.value);
        if (input) {
            input.onmidimessage = handleMidiMessage;
        }
    };
    const listen = (cb) => {
        listeners.value.add(cb);
        attachSelectedInput();
        return () => listeners.value.delete(cb);
    };
    const send = (deviceId, message) => {
        const output = access.value?.outputs.get(deviceId);
        if (!output)
            return;
        switch (message.type) {
            case 'noteon':
                output.send([0x90, message.note ?? 0, Math.floor((message.velocity ?? 1) * 127)]);
                break;
            case 'noteoff':
                output.send([0x80, message.note ?? 0, 0]);
                break;
            case 'start':
                output.send([0xfa]);
                break;
            case 'stop':
                output.send([0xfc]);
                break;
            case 'clock':
                output.send([0xf8]);
                break;
            default:
                break;
        }
    };
    const sendClockTick = () => {
        if (selectedOutputId.value) {
            send(selectedOutputId.value, { type: 'clock' });
        }
    };
    const sendStart = () => {
        if (selectedOutputId.value) {
            send(selectedOutputId.value, { type: 'start' });
        }
    };
    const sendStop = () => {
        if (selectedOutputId.value) {
            send(selectedOutputId.value, { type: 'stop' });
        }
    };
    const setSelectedInput = (id) => {
        selectedInputId.value = id;
        attachSelectedInput();
    };
    const setSelectedOutput = (id) => {
        selectedOutputId.value = id;
    };
    const mapNoteToPad = (note) => mapping.value.noteMap[note];
    const setPadForNote = (note, padId) => {
        if (padId) {
            mapping.value.noteMap[note] = padId;
        }
        else {
            delete mapping.value.noteMap[note];
        }
    };
    if (typeof window !== 'undefined') {
        handlePageHide = () => {
            detachInputs();
            if (access.value) {
                access.value.onstatechange = null;
            }
        };
        handlePageShow = () => {
            if (access.value) {
                refreshDevices();
                attachSelectedInput();
                access.value.onstatechange = () => {
                    refreshDevices();
                    attachSelectedInput();
                };
            }
        };
        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('pageshow', handlePageShow);
    }
    onBeforeUnmount(() => {
        if (handlePageHide) {
            window.removeEventListener('pagehide', handlePageHide);
        }
        if (handlePageShow) {
            window.removeEventListener('pageshow', handlePageShow);
        }
        detachInputs();
        if (access.value) {
            access.value.onstatechange = null;
        }
    });
    return {
        access,
        inputs,
        outputs,
        mapping,
        selectedInputId,
        selectedOutputId,
        supportsMidi,
        requestAccess,
        refreshDevices,
        listen,
        send,
        sendClockTick,
        sendStart,
        sendStop,
        mapNoteToPad,
        setPadForNote,
        setMapping: (next) => {
            mapping.value = next;
        },
        setSelectedInput,
        setSelectedOutput
    };
}
//# sourceMappingURL=useMidi.client.js.map