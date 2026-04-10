import { Platform } from 'react-native';

const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const PROD_API_URL = 'https://coffich-backend.onrender.com';

function getDefaultDevApiUrl() {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://127.0.0.1:8000';
}

export const API_BASE_URL =
  envApiUrl && envApiUrl.length > 0
    ? envApiUrl.replace(/\/$/, '')
    : __DEV__
      ? getDefaultDevApiUrl()
      : PROD_API_URL;

export const DEV_FALLBACK_LOCATION = {
  latitude: 39.767,
  longitude: 64.423,
};
