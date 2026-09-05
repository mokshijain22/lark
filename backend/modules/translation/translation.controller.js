// Auto-translation: translating message text needs a real translation provider
// (Google Translate API, DeepL, etc.) — no API key was provided for this project,
// so this endpoint is wired end-to-end but returns a clear "not configured" error
// until TRANSLATE_API_KEY is added to .env. Swap the body of `translateText`
// for the real provider call when ready; the route/response shape won't need to change.

const translateText = async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    if (!text || !targetLang) {
      return res.status(400).json({ success: false, message: 'text and targetLang are required' });
    }

    if (!process.env.TRANSLATE_API_KEY) {
      return res.status(501).json({
        success: false,
        message: 'Translation provider not configured. Add TRANSLATE_API_KEY to backend/.env (e.g. Google Cloud Translation or DeepL) to enable this feature.',
      });
    }

    // Example shape for wiring a real provider later:
    // const translated = await callTranslateProvider(text, targetLang);
    // return res.status(200).json({ success: true, data: { original: text, translated, targetLang } });

    return res.status(501).json({ success: false, message: 'Provider call not implemented yet' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
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
