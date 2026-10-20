import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_RECEIPT_PHOTO_BYTES, validateReceiptPhoto } from '../src/photo-storage.mjs';

test('aceita uma foto de comprovante dentro do limite', () => {
  assert.equal(validateReceiptPhoto({ type: 'image/jpeg', size: 2_000_000 }), true);
});

test('rejeita arquivos que não sejam imagem', () => {
  assert.throws(() => validateReceiptPhoto({ type: 'application/pdf', size: 1000 }), /imagem/i);
});

test('rejeita fotos acima do limite', () => {
  assert.throws(() => validateReceiptPhoto({ type: 'image/jpeg', size: MAX_RECEIPT_PHOTO_BYTES + 1 }), /20 MB/i);
});
