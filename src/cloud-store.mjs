export function mapRemotePunch(row) {
  return {
    id: row.id,
    kind: row.kind,
    at: row.at,
    manual: Boolean(row.manual),
    photoId: row.photo_path ? row.id : null,
    photoPath: row.photo_path || null,
  };
}

export function receiptObjectPath(userId, punchId) {
  if (!userId || !punchId || /[/\\]/.test(userId) || /[/\\]/.test(punchId) || punchId === '.' || punchId === '..') {
    throw new Error('Informe um usuário e marcação válidos para guardar a foto.');
  }
  return `${userId}/${punchId}`;
}

function throwOnError(result) {
  if (result.error) throw result.error;
  return result.data;
}

export function createCloudStore(client, userId) {
  if (!client || !userId) throw new Error('Sessão autenticada necessária para acessar os dados.');
  const receipts = client.storage.from('receipts');

  return {
    async load() {
      const [settingsResult, punchesResult] = await Promise.all([
        client.from('user_settings').select('name,target_minutes,adjustments').eq('user_id', userId).maybeSingle(),
        client.from('punches').select('id,kind,at,manual,photo_path').eq('user_id', userId).order('at', { ascending: true }),
      ]);
      const settings = throwOnError(settingsResult);
      const rows = throwOnError(punchesResult) || [];
      return {
        settings: settings ? {
          name: settings.name || '',
          targetMinutes: settings.target_minutes ?? 480,
          adjustments: settings.adjustments || [],
        } : null,
        punches: rows.map(mapRemotePunch),
      };
    },

    async saveSettings(state) {
      const result = await client.from('user_settings').upsert({
        user_id: userId,
        name: state.name || '',
        target_minutes: state.targetMinutes,
        adjustments: state.adjustments || [],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      throwOnError(result);
    },

    async savePunch(punch, photoBlob = null) {
      let photoPath = punch.photoPath || null;
      if (photoBlob) {
        photoPath = receiptObjectPath(userId, punch.id);
        const upload = await receipts.upload(photoPath, photoBlob, {
          upsert: true,
          contentType: photoBlob.type || 'application/octet-stream',
        });
        throwOnError(upload);
      }
      const result = await client.from('punches').upsert({
        id: punch.id,
        user_id: userId,
        kind: punch.kind,
        at: punch.at,
        manual: Boolean(punch.manual),
        photo_path: photoPath,
      }, { onConflict: 'user_id,id' });
      throwOnError(result);
      return photoPath;
    },

    async deletePunches(punches) {
      const ids = [...new Set(punches.map(punch => punch.id).filter(Boolean))];
      const paths = [...new Set(punches.map(punch => punch.photoPath || (punch.photoId ? receiptObjectPath(userId, punch.id) : null)).filter(Boolean))];
      if (ids.length) {
        const result = await client.from('punches').delete().eq('user_id', userId).in('id', ids);
        throwOnError(result);
      }
      if (paths.length) throwOnError(await receipts.remove(paths));
    },

    async getReceiptPhoto(punch) {
      if (!punch?.photoPath) return null;
      const result = await receipts.download(punch.photoPath);
      return throwOnError(result);
    },

    async deleteSettings() {
      const result = await client.from('user_settings').delete().eq('user_id', userId);
      throwOnError(result);
    },
  };
}
