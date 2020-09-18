import { shell } from 'electron';

export default async function openExternal(url) {
  try {
    const result = await shell.openExternal(url);
    console.info(result);
  } catch (error) {
    console.error(error);
  }
}
