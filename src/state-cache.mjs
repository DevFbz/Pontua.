export const LEGACY_STATE_KEY = 'pontua.personal.v1';

export function stateKeyForUser(userId) {
  if (typeof userId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(userId)) {
    throw new Error('Informe o identificador de um usuário autenticado.');
  }
  return `${LEGACY_STATE_KEY}.${userId}`;
}
