import * as ImagePicker from 'expo-image-picker';

export interface PickedImageAsset {
  uri: string;
  fileName?: string | null;
}

export async function requestMediaLibraryPermission(): Promise<boolean> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return permission.granted;
}

export async function pickImageAssetFromLibrary(): Promise<PickedImageAsset | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0] as ImagePicker.ImagePickerAsset & {
    file?: { name?: string };
  };

  return {
    uri: asset.uri,
    fileName: asset.fileName ?? asset.file?.name ?? null,
  };
}

export async function pickImageFromLibrary(): Promise<string | null> {
  const asset = await pickImageAssetFromLibrary();
  return asset ? asset.uri : null;
}
