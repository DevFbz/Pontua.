export const MAX_RECEIPT_PHOTO_BYTES = 20 * 1024 * 1024;

const DATABASE_NAME = 'pontua-receipt-photos';
const DATABASE_VERSION = 1;
const STORE_NAME = 'photos';
let databasePromise;

export function validateReceiptPhoto(file) {
  if (!file || !Number.isFinite(file.size) || file.size <= 0) {
    throw new Error('A foto está vazia ou não pôde ser lida.');
  }
  if (typeof file.type !== 'string' || !file.type.toLowerCase().startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem.');
  }
  if (file.size > MAX_RECEIPT_PHOTO_BYTES) {
    throw new Error('A foto não pode ser maior que 20 MB.');
  }
  return true;
}

export async function prepareReceiptPhoto(file) {
  validateReceiptPhoto(file);
  if (typeof globalThis.createImageBitmap !== 'function') return file;

  let bitmap;
  try {
    bitmap = await globalThis.createImageBitmap(file);
    const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 1_500_000) return file;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const compressed = await new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Falha ao preparar a imagem.')), 'image/jpeg', 0.9);
    });
    return compressed.size < file.size ? compressed : file;
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}

function openDatabase() {
  if (typeof globalThis.indexedDB === 'undefined') {
    return Promise.reject(new Error('Este navegador não oferece armazenamento de fotos.'));
  }
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = globalThis.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => {
          database.close();
          databasePromise = undefined;
        };
        resolve(database);
      };
      request.onerror = () => reject(request.error || new Error('Não foi possível abrir o armazenamento de fotos.'));
      request.onblocked = () => reject(new Error('Feche as outras abas do Pontua e tente novamente.'));
    }).catch(error => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}

async function runTransaction(mode, action) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    let result;
    let settled = false;
    const fail = error => {
      if (settled) return;
      settled = true;
      reject(error || new Error('Não foi possível salvar a foto.'));
    };
    transaction.oncomplete = () => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    transaction.onerror = () => fail(transaction.error);
    transaction.onabort = () => fail(transaction.error);
    try {
      const request = action(transaction.objectStore(STORE_NAME));
      if (request) {
        request.onsuccess = () => { result = request.result; };
        request.onerror = () => fail(request.error);
      }
    } catch (error) {
      fail(error);
      transaction.abort();
    }
  });
}

export function putPunchPhoto(id, blob) {
  if (!id || !(blob instanceof Blob) || !blob.type.startsWith('image/')) {
    return Promise.reject(new Error('A foto do comprovante é inválida.'));
  }
  return runTransaction('readwrite', store => store.put({ id, blob }));
}

export function getPunchPhoto(id) {
  if (!id) return Promise.resolve(null);
  return runTransaction('readonly', store => store.get(id)).then(record => record?.blob || null);
}

export function deletePunchPhotos(ids) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) return Promise.resolve();
  return runTransaction('readwrite', store => {
    for (const id of uniqueIds) store.delete(id);
    return null;
  });
}

export function clearPunchPhotos() {
  return runTransaction('readwrite', store => store.clear());
}
