import { ref } from 'vue';
const DB_NAME = 'drum-machine-db';
const DB_VERSION = 2;
const stripNonSerializableSample = (sample) => {
    if (!sample)
        return undefined;
    const sanitized = {
        id: sample.id,
        name: sample.name
    };
    if (sample.url !== undefined) {
        sanitized.url = sample.url;
    }
    if (sample.format !== undefined) {
        sanitized.format = sample.format;
    }
    return sanitized;
};
const serializeSoundbank = (bank) => {
    const pads = {};
    Object.entries(bank.pads).forEach(([padId, sample]) => {
        const sanitized = stripNonSerializableSample(sample);
        if (sanitized) {
            pads[padId] = sanitized;
        }
    });
    return {
        id: bank.id,
        name: bank.name,
        createdAt: bank.createdAt,
        updatedAt: bank.updatedAt,
        pads
    };
};
export function useSoundbankStorage() {
    const dbRef = ref(null);
    const open = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('soundbanks')) {
                    db.createObjectStore('soundbanks', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('samples')) {
                    db.createObjectStore('samples', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('patterns')) {
                    const store = db.createObjectStore('patterns', { keyPath: 'id' });
                    store.createIndex('bankId', 'bankId', { unique: false });
                }
            };
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                dbRef.value = request.result;
                resolve(request.result);
            };
        });
    };
    const ensureDb = async () => {
        if (dbRef.value)
            return dbRef.value;
        return open();
    };
    const saveBank = async (bank) => {
        const db = await ensureDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['soundbanks'], 'readwrite');
            tx.objectStore('soundbanks').put(serializeSoundbank(bank));
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    };
    const saveSample = async (sample) => {
        const db = await ensureDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['samples'], 'readwrite');
            const record = { id: sample.id, name: sample.name, blob: sample.blob };
            if (sample.format) {
                record.format = sample.format;
            }
            tx.objectStore('samples').put(record);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    };
    const loadBanks = async () => {
        const db = await ensureDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['soundbanks'], 'readonly');
            const request = tx.objectStore('soundbanks').getAll();
            request.onsuccess = () => resolve(request.result ?? []);
            request.onerror = () => reject(request.error);
        });
    };
    const loadSample = async (sampleId) => {
        const db = await ensureDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['samples'], 'readonly');
            const request = tx.objectStore('samples').get(sampleId);
            request.onsuccess = () => {
                const result = request.result;
                if (!result) {
                    resolve(null);
                    return;
                }
                const restored = { id: result.id, name: result.name, blob: result.blob };
                const format = result.format;
                if (format) {
                    restored.format = format;
                }
                resolve(restored);
            };
            request.onerror = () => reject(request.error);
        });
    };
    const savePatterns = async (bankId, patterns) => {
        const db = await ensureDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['patterns'], 'readwrite');
            patterns.forEach((pattern) => {
                const record = { id: `${bankId}:${pattern.id}`, bankId, pattern };
                tx.objectStore('patterns').put(record);
            });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    };
    const loadPatterns = async (bankId) => {
        const db = await ensureDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['patterns'], 'readonly');
            const index = tx.objectStore('patterns').index('bankId');
            const request = index.getAll(bankId);
            request.onsuccess = () => {
                const records = request.result ?? [];
                resolve(records.map((record) => record.pattern));
            };
            request.onerror = () => reject(request.error);
        });
    };
    return {
        saveBank,
        saveSample,
        loadBanks,
        loadSample,
        savePatterns,
        loadPatterns
    };
}
//# sourceMappingURL=useSoundbankStorage.client.js.map