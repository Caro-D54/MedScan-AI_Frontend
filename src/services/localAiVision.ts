import type { ScanResult } from './scanService';

interface VademecumEntry {
  brandName: string;
  activeIngredient: string;
  aliases: string[];
}

/**
 * Diccionario farmacéutico de marcas comerciales y principios activos frecuentes.
 */
const VADEMECUM: VademecumEntry[] = [
  { brandName: 'Tafirol', activeIngredient: 'Paracetamol', aliases: ['tafirol', 'tafirol forte', 'tafirol 1g', 'tafirol 500'] },
  { brandName: 'Termofren', activeIngredient: 'Paracetamol', aliases: ['termofren', 'panadol', 'dirox'] },
  { brandName: 'Ibupirac', activeIngredient: 'Ibuprofeno', aliases: ['ibupirac', 'ibupirac 400', 'ibupirac 600', 'ibupirac fem', 'ibupirac plus'] },
  { brandName: 'Actron', activeIngredient: 'Ibuprofeno', aliases: ['actron', 'actron 400', 'actron 600', 'actron rapido', 'actron pediatrico'] },
  { brandName: 'Fabogesic', activeIngredient: 'Ibuprofeno', aliases: ['fabogesic', 'ibucler', 'ibumar'] },
  { brandName: 'Amoxidal', activeIngredient: 'Amoxicilina', aliases: ['amoxidal', 'amoxidal 500', 'amoxidal duo', 'amoxidal 875', 'trifamox'] },
  { brandName: 'Optamox', activeIngredient: 'Amoxicilina / Ácido Clavulánico', aliases: ['optamox', 'optamox duo', 'augmentin', 'amixen'] },
  { brandName: 'Bayaspirina', activeIngredient: 'Ácido Acetilsalicílico', aliases: ['bayaspirina', 'aspirineta', 'aspirina', 'ecotrin'] },
  { brandName: 'Novalgina', activeIngredient: 'Dipirona', aliases: ['novalgina', 'dipirona'] },
  { brandName: 'Buscapina', activeIngredient: 'Hioscina N-butilbromuro', aliases: ['buscapina', 'buscapina compositum', 'hioscina'] },
  { brandName: 'Sertal', activeIngredient: 'Propinox / Clonixinato de lisina', aliases: ['sertal', 'sertal compuesto', 'sertal perlas'] },
  { brandName: 'Dorixina', activeIngredient: 'Clonixinato de lisina', aliases: ['dorixina', 'clonixinato'] },
  { brandName: 'Oxa', activeIngredient: 'Diclofenac sódico', aliases: ['oxa', 'oxa b12', 'dioxaflex', 'voltaren', 'diclofenac'] },
  { brandName: 'Dolten', activeIngredient: 'Ketorolac', aliases: ['dolten', 'sinalgico', 'ketorolac', 'keterolac'] },
  { brandName: 'Acimed', activeIngredient: 'Omeprazol', aliases: ['acimed', 'ulpax', 'losec', 'faboprazol', 'omeprazol'] },
  { brandName: 'Pantoprazol', activeIngredient: 'Pantoprazol', aliases: ['pantoprazol', 'pantus', 'peptazol', 'esomeprazol', 'nexium', 'lansoprazol'] },
  { brandName: 'Taural', activeIngredient: 'Famotidina', aliases: ['taural', 'famotidina'] },
  { brandName: 'Mylanta', activeIngredient: 'Hidróxido de aluminio y magnesio', aliases: ['mylanta', 'aludrox', 'rennie'] },
  { brandName: 'Uvasal', activeIngredient: 'Bicarbonato de sodio / Ácido cítrico', aliases: ['uvasal', 'alikal'] },
  { brandName: 'Reliveran', activeIngredient: 'Metoclopramida', aliases: ['reliveran', 'metoclopramida', 'primperan'] },
  { brandName: 'Factor AG', activeIngredient: 'Simeticona', aliases: ['factor ag', 'simeticona', 'meteoxan'] },
  { brandName: 'Suprasec', activeIngredient: 'Loperamida', aliases: ['suprasec', 'loperamida', 'imodium'] },
  { brandName: 'Lotrial', activeIngredient: 'Enalapril', aliases: ['lotrial', 'gadopril', 'renitec', 'enalapril'] },
  { brandName: 'Losacor', activeIngredient: 'Losartán potásico', aliases: ['losacor', 'cozaar', 'loplok', 'losartan', 'losartán'] },
  { brandName: 'Valsartán', activeIngredient: 'Valsartán', aliases: ['valsartan', 'valsartán', 'diovan', 'sarval', 'telmisartan', 'micardis'] },
  { brandName: 'Amloc', activeIngredient: 'Amlodipina', aliases: ['amloc', 'pelba', 'norvasc', 'amlodipina', 'amlodipino'] },
  { brandName: 'Plenacor', activeIngredient: 'Atenolol', aliases: ['plenacor', 'tenormin', 'atenolol'] },
  { brandName: 'Concor', activeIngredient: 'Bisoprolol', aliases: ['concor', 'corbis', 'bisoprolol'] },
  { brandName: 'Dilatrend', activeIngredient: 'Carvedilol', aliases: ['dilatrend', 'bidecar', 'carvedilol'] },
  { brandName: 'Lipitor', activeIngredient: 'Atorvastatina', aliases: ['lipitor', 'zarator', 'ampliar', 'atorvastatina'] },
  { brandName: 'Rovartal', activeIngredient: 'Rosuvastatina', aliases: ['rovartal', 'crestor', 'rosuvastatina', 'sinlip'] },
  { brandName: 'Glucophage', activeIngredient: 'Metformina', aliases: ['glucophage', 'dbi', 'islotin', 'metformina'] },
  { brandName: 'T4 Montpellier', activeIngredient: 'Levotiroxina sódica', aliases: ['t4 montpellier', 't4', 'euthyrox', 'levotiroxina'] },
  { brandName: 'Rivotril', activeIngredient: 'Clonazepam', aliases: ['rivotril', 'clonagin', 'diocam', 'clonazepam'] },
  { brandName: 'Alplax', activeIngredient: 'Alprazolam', aliases: ['alplax', 'xanax', 'tranquinal', 'alprazolam'] },
  { brandName: 'Valium', activeIngredient: 'Diazepam', aliases: ['valium', 'plidan', 'diazepam', 'lorazepam', 'trapax'] },
  { brandName: 'Somit', activeIngredient: 'Zolpidem', aliases: ['somit', 'ambien', 'zolpidem'] },
  { brandName: 'Zoloft', activeIngredient: 'Sertralina', aliases: ['zoloft', 'atenix', 'sertralina'] },
  { brandName: 'Lexapro', activeIngredient: 'Escitalopram', aliases: ['lexapro', 'meridian', 'escitalopram'] },
  { brandName: 'Foxetin', activeIngredient: 'Fluoxetina', aliases: ['foxetin', 'prozac', 'fluoxetina'] },
  { brandName: 'Aerotina', activeIngredient: 'Loratadina', aliases: ['aerotina', 'alergiano', 'clarityne', 'loratadina', 'bedix'] },
  { brandName: 'Allegra', activeIngredient: 'Fexofenadina', aliases: ['allegra', 'fexofenadina'] },
  { brandName: 'Alercas', activeIngredient: 'Cetirizina', aliases: ['alercas', 'zyrtec', 'cetirizina'] },
  { brandName: 'Hexaler', activeIngredient: 'Desloratadina', aliases: ['hexaler', 'desloratadina', 'aerius'] },
  { brandName: 'Decadron', activeIngredient: 'Dexametasona', aliases: ['decadron', 'dexametasona'] },
  { brandName: 'Deltisona', activeIngredient: 'Meprednisona', aliases: ['deltisona', 'meprednisona', 'prednisona', 'meticorten'] },
  { brandName: 'Corteroid', activeIngredient: 'Betametasona', aliases: ['corteroid', 'celestone', 'betametasona'] },
  { brandName: 'Cronopen', activeIngredient: 'Azitromicina', aliases: ['cronopen', 'zitromax', 'misultina', 'azitromicina', 'tricoplina'] },
  { brandName: 'Ciriax', activeIngredient: 'Ciprofloxacina', aliases: ['ciriax', 'septicide', 'ciprofloxacina', 'ciprofloxacino'] },
  { brandName: 'Ceporexin', activeIngredient: 'Cefalexina', aliases: ['ceporexin', 'keflex', 'cefalexina'] },
  { brandName: 'Bactrim', activeIngredient: 'Sulfametoxazol / Trimetoprima', aliases: ['bactrim', 'novarim', 'sulfametoxazol', 'trimetoprima'] },
  { brandName: 'Ventolin', activeIngredient: 'Salbutamol', aliases: ['ventolin', 'salbutral', 'salbutamol'] },
  { brandName: 'Neumotex', activeIngredient: 'Budesonide', aliases: ['neumotex', 'budesonide', 'budesonida'] },
  { brandName: 'Qura Plus', activeIngredient: 'Paracetamol / Pseudoefedrina / Clorfeniramina', aliases: ['qura plus', 'qura', 'curaplus', 'refrianex', 'tabcin'] },
  { brandName: 'Migral', activeIngredient: 'Ergotamina / Dipirona / Cafeína', aliases: ['migral', 'tetralgin'] },
  { brandName: 'Prontoflam', activeIngredient: 'Meloxicam', aliases: ['prontoflam', 'mobic', 'meloxicam'] },
  { brandName: 'Acemuk', activeIngredient: 'Acetilcisteína', aliases: ['acemuk', 'alermuc', 'acetilcisteina', 'acetilcisteína'] },
  { brandName: 'Bisolvon', activeIngredient: 'Bromhexina', aliases: ['bisolvon', 'bromhexina'] },
  { brandName: 'Paracetamol', activeIngredient: 'Paracetamol', aliases: ['paracetamol', 'acetaminofen', 'acetaminophen'] },
  { brandName: 'Ibuprofeno', activeIngredient: 'Ibuprofeno', aliases: ['ibuprofeno', 'ibuprofen'] },
  { brandName: 'Amoxicilina', activeIngredient: 'Amoxicilina', aliases: ['amoxicilina', 'amoxicillin'] },
];

const PACKAGING_NOISE_PATTERNS = [
  /\b(venta\s+bajo\s+receta|venta\s+libre|industria\s+argentina|uso\s+oral|via\s+oral|vía\s+oral)\b/gi,
  /\b(comprimidos?\s+recubiertos?|comprimidos?|capsulas?\s+blandas?|cápsulas?\s+blandas?|capsulas?|cápsulas?|tabletas?|jarabe|gotas|suspension|suspensión)\b/gi,
  /\b(contenido|contiene|envase|laboratorios?|bago|bagó|roemmers|elea|raffo|gador|montpellier|bayer|pfizer|casasco|baliarda|isa|savant|sandoz|teva|genomma)\b/gi,
  /\b\d+\s*(mg|g|mcg|ml|ui|%)\b/gi,
  /\bx\s*\d+\b/gi,
];

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toTitleCase(input: string): string {
  return input
    .trim()
    .split(/\s+/)
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1).toLowerCase() : ''))
    .join(' ');
}

function cleanLine(line: string): string {
  let cleaned = line;
  for (const pattern of PACKAGING_NOISE_PATTERNS) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  cleaned = cleaned
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
}

const ACTIVE_INGREDIENT_SUFFIX_REGEX =
  /\b[a-záéíóúñ]{4,}(ina|ol|an|án|il|am|ac|prazol|statina|ciclina|floxacina|pril|sartan|sartán|dipina|dipino|oxetina|profeno|tamol|fenac|coxib|azol|mida|zona|casona|lukast|gliptina|gliflozina|tidina|tadina|zina)\b/i;

/**
 * Extrae el nombre comercial y el principio activo a partir del texto leído por OCR o del nombre del archivo.
 */
export function extractMedicationFromText(
  ocrText: string,
  fileNameHint?: string | null,
): ScanResult {
  const combinedRaw = `${ocrText || ''}\n${fileNameHint ? fileNameHint.replace(/\.[a-z0-9]+$/i, '') : ''}`;
  const normalizedCombined = normalizeText(combinedRaw);

  let matchedBrand: string | null = null;
  let matchedIngredient: string | null = null;

  // 1. Buscar coincidencias exactas de palabra o frase en el vademécum
  for (const entry of VADEMECUM) {
    for (const alias of entry.aliases) {
      const normalizedAlias = normalizeText(alias);
      const regex = new RegExp(`\\b${normalizedAlias}\\b`, 'i');
      if (regex.test(normalizedCombined)) {
        matchedIngredient = entry.activeIngredient;
        // Si el alias coincide con un nombre comercial específico, priorizarlo
        if (normalizeText(alias) !== normalizeText(entry.activeIngredient)) {
          matchedBrand = entry.brandName;
          break;
        } else if (!matchedBrand) {
          matchedBrand = entry.brandName;
        }
      }
    }
    if (matchedBrand && matchedBrand !== matchedIngredient) {
      break;
    }
  }

  // 2. Analizar líneas individuales del texto OCR para detectar marca o principio activo adicionales
  const candidateLines = (ocrText || '')
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((line) => line.length >= 3 && line.split(/\s+/).every((w) => w.length >= 2));

  const dosageMatch = (combinedRaw || '').match(/\b(\d+(?:[.,]\d+)?\s*(?:mg|g|mcg|ml))\b/i);
  const detectedDosage = dosageMatch ? dosageMatch[1].trim() : '';

  const freqMatch = (combinedRaw || '').match(
    /\b(cada\s+\d+\s+horas?|cada\s+\d+\s+hs|\d+\s*(?:veces|comprimidos?)\s*al\s*d[ií]a|cada\s+d[ií]a|1\s*por\s*d[ií]a)\b/i,
  );
  const detectedFrequency = freqMatch ? freqMatch[1].trim() : '';

  if (matchedBrand && matchedIngredient) {
    // Si encontramos principio activo genérico como marca pero hay otra línea prominente en la caja, usar esa línea como marca comercial
    if (
      normalizeText(matchedBrand) === normalizeText(matchedIngredient) &&
      candidateLines.length > 0
    ) {
      const otherLine = candidateLines.find(
        (line) => normalizeText(line) !== normalizeText(matchedIngredient!),
      );
      if (otherLine && otherLine.length <= 28) {
        matchedBrand = toTitleCase(otherLine);
      }
    }

    return {
      brandName: matchedBrand,
      medication: matchedBrand,
      name: matchedBrand,
      activeIngredient: matchedIngredient,
      dosage: detectedDosage,
      frequency: detectedFrequency,
      instructions: '',
    };
  }

  // 3. Heurística sobre líneas del envase cuando el medicamento no está en el diccionario
  let detectedBrand = '';
  let detectedActive = '';

  for (const line of candidateLines) {
    if (ACTIVE_INGREDIENT_SUFFIX_REGEX.test(line) && !detectedActive) {
      detectedActive = toTitleCase(line);
    } else if (!detectedBrand && line.length >= 3 && line.length <= 30) {
      detectedBrand = toTitleCase(line);
    }
  }

  if (!detectedBrand && detectedActive) {
    detectedBrand = detectedActive;
  }

  // 4. Si no hubo líneas en OCR pero el nombre del archivo contiene texto útil
  if (!detectedBrand && fileNameHint) {
    const cleanedFile = cleanLine(fileNameHint.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' '));
    if (cleanedFile.length >= 3 && !/^(img|image|photo|foto|whatsapp|screenshot|captura|dsc|pic)/i.test(cleanedFile)) {
      detectedBrand = toTitleCase(cleanedFile);
      if (ACTIVE_INGREDIENT_SUFFIX_REGEX.test(cleanedFile)) {
        detectedActive = detectedBrand;
      }
    }
  }

  return {
    brandName: detectedBrand,
    medication: detectedBrand,
    name: detectedBrand,
    activeIngredient: detectedActive,
    dosage: detectedDosage,
    frequency: detectedFrequency,
    instructions: '',
  };
}

interface TesseractGlobal {
  recognize: (
    image: string,
    langs?: string,
  ) => Promise<{ data?: { text?: string } }>;
}

function loadTesseractInBrowser(): Promise<TesseractGlobal | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(null);
  }

  const win = window as unknown as { Tesseract?: TesseractGlobal };
  if (win.Tesseract) {
    return Promise.resolve(win.Tesseract);
  }

  return new Promise((resolve) => {
    const existingScript = document.querySelector('script[data-medscan-tesseract="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(win.Tesseract ?? null));
      existingScript.addEventListener('error', () => resolve(null));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.async = true;
    script.setAttribute('data-medscan-tesseract', 'true');
    script.onload = () => resolve(win.Tesseract ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

function preprocessImageForOcr(imageUri: string): Promise<string> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(imageUri);
  }

  return new Promise((resolve) => {
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const maxDim = 1400;
          let width = img.naturalWidth || img.width || 800;
          let height = img.naturalHeight || img.height || 600;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          } else if (width < 600 && height < 600) {
            width *= 2;
            height *= 2;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(imageUri);
            return;
          }

          ctx.filter = 'grayscale(100%) contrast(145%)';
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(imageUri);
        }
      };
      img.onerror = () => resolve(imageUri);
      img.src = imageUri;
    } catch {
      resolve(imageUri);
    }
  });
}

/**
 * Analiza localmente la imagen del envase mediante OCR y diccionario farmacéutico
 * para extraer el nombre comercial y el principio activo cuando el backend de OpenAI no está disponible.
 */
export async function analyzeMedicationImageLocally(
  photoUri: string,
  fileNameHint?: string | null,
): Promise<ScanResult> {
  let ocrText = '';

  try {
    const tesseract = await loadTesseractInBrowser();
    if (tesseract) {
      const preparedUri = await preprocessImageForOcr(photoUri);
      const recognition = await tesseract.recognize(preparedUri, 'spa+eng');
      ocrText = recognition?.data?.text ?? '';
    }
  } catch {
    // Continuar con pistas disponibles si el motor OCR falla
  }

  // Fallback para entornos móviles (React Native / Expo Go)
  if (!ocrText) {
    try {
      const formData = new FormData();
      formData.append("apikey", "K88856237488957");
      formData.append("language", "spa");
      formData.append("isOverlayRequired", "false");
      formData.append("scale", "true");
      formData.append("OCREngine", "2");

      if (photoUri.startsWith("data:")) {
        formData.append("base64Image", photoUri);
      } else {
        const isPng = photoUri.toLowerCase().endsWith(".png");
        formData.append("file", {
          uri: photoUri,
          name: isPng ? "photo.png" : "photo.jpg",
          type: isPng ? "image/png" : "image/jpeg",
        } as unknown as Blob);
      }

      const res = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const json = await res.json();
        ocrText = json?.ParsedResults?.[0]?.ParsedText ?? "";
      }
    } catch {
      // Ignorar fallo de red puntual
    }
  }

  return extractMedicationFromText(ocrText, fileNameHint);
}
