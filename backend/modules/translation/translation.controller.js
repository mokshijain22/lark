// Auto-translation: by default this calls MyMemory (api.mymemory.translated.net),
// a free translation API that needs no API key, so the feature works out of the box.
// If TRANSLATE_API_KEY is set (e.g. a Google Cloud Translation or DeepL key), that
// provider is used instead for higher quality/rate limits. The response shape is
// the same either way, so swapping providers later needs no frontend changes.

const translateWithGoogleFree = async (text, targetLang, sourceLang) => {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: sourceLang || 'auto',
    tl: targetLang,
    dt: 't',
    q: text,
  });
  const resp = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`);
  if (!resp.ok) {
    throw new Error(`Google Translate request failed with status ${resp.status}`);
  }
  const data = await resp.json();
  // Response shape: [[[translatedChunk, originalChunk, ...], ...], ...]
  const translated = data?.[0]?.map((chunk) => chunk[0]).join('');
  if (!translated) {
    throw new Error('Google Translate returned no translation');
  }
  return translated;
};

const translateWithMyMemory = async (text, targetLang, sourceLang) => {
  const params = new URLSearchParams({
    q: text,
    langpair: `${sourceLang || 'en'}|${targetLang}`,
  });
  const resp = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`);
  if (!resp.ok) {
    throw new Error(`MyMemory request failed with status ${resp.status}`);
  }
  const data = await resp.json();
  const translated = data?.responseData?.translatedText;
  if (!translated) {
    throw new Error('MyMemory returned no translation');
  }
  return translated;
};

const translateWithDeepL = async (text, targetLang, sourceLang) => {
  const resp = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${process.env.TRANSLATE_API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      text,
      target_lang: targetLang.toUpperCase(),
      ...(sourceLang ? { source_lang: sourceLang.toUpperCase() } : {}),
    }),
  });
  if (!resp.ok) {
    throw new Error(`DeepL request failed with status ${resp.status}`);
  }
  const data = await resp.json();
  const translated = data?.translations?.[0]?.text;
  if (!translated) {
    throw new Error('DeepL returned no translation');
  }
  return translated;
};

const translateText = async (req, res) => {
  try {
    const { text, targetLang, sourceLang } = req.body;
    if (!text || !targetLang) {
      return res.status(400).json({ success: false, message: 'text and targetLang are required' });
    }

    let translated;
    let provider;
    if (process.env.TRANSLATE_API_KEY) {
      translated = await translateWithDeepL(text, targetLang, sourceLang);
      provider = 'deepl';
    } else {
      try {
        translated = await translateWithGoogleFree(text, targetLang, sourceLang);
        provider = 'google-free';
      } catch (primaryErr) {
        console.error('Primary translation provider (Google) failed:', primaryErr.message);
        try {
          translated = await translateWithMyMemory(text, targetLang, sourceLang);
          provider = 'mymemory';
        } catch (fallbackErr) {
          console.error('Fallback translation provider (MyMemory) also failed:', fallbackErr.message);
          throw new Error(`Google: ${primaryErr.message} | MyMemory: ${fallbackErr.message}`);
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: { original: text, translated, targetLang, provider },
    });
  } catch (err) {
    return res.status(502).json({ success: false, message: `Translation provider error: ${err.message}` });
  }
};

// PATCH /api/translation/preference  { preferredLanguage }
const OrgMember = require('../../shared/models/OrgMember');
const setPreferredLanguage = async (req, res) => {
  try {
    const { preferredLanguage } = req.body;
    const member = await OrgMember.findByIdAndUpdate(req.user._id, { preferredLanguage }, { new: true });
    return res.status(200).json({ success: true, data: member });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { translateText, setPreferredLanguage };
