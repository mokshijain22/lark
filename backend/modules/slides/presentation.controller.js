const Presentation = require('./presentation.model');

const create = async (req, res) => {
  try {
    const { title, theme } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'title is required' });
    const pres = await Presentation.create({ title, theme, createdBy: req.user._id });
    return res.status(201).json({ success: true, data: pres });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const list = await Presentation.find().select('title theme createdBy createdAt updatedAt').populate('createdBy', 'name avatar').sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const pres = await Presentation.findById(req.params.id);
    if (!pres) return res.status(404).json({ success: false, message: 'Presentation not found' });
    return res.status(200).json({ success: true, data: pres });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const addSlide = async (req, res) => {
  try {
    const pres = await Presentation.findById(req.params.id);
    if (!pres) return res.status(404).json({ success: false, message: 'Presentation not found' });
    pres.slides.push({ order: pres.slides.length, elements: [], background: '#FFFFFF' });
    await pres.save();
    return res.status(201).json({ success: true, data: pres.slides[pres.slides.length - 1] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateSlide = async (req, res) => {
  try {
    const pres = await Presentation.findById(req.params.id);
    if (!pres) return res.status(404).json({ success: false, message: 'Presentation not found' });
    const slide = pres.slides.id(req.params.slideId);
    if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });

    if (req.body.elements !== undefined) slide.elements = req.body.elements;
    if (req.body.background !== undefined) slide.background = req.body.background;
    await pres.save();
    return res.status(200).json({ success: true, data: slide });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteSlide = async (req, res) => {
  try {
    const pres = await Presentation.findById(req.params.id);
    if (!pres) return res.status(404).json({ success: false, message: 'Presentation not found' });
    pres.slides.id(req.params.slideId)?.deleteOne();
    await pres.save();
    return res.status(200).json({ success: true, message: 'Slide deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const reorderSlides = async (req, res) => {
  try {
    const { orderedIds } = req.body; // array of slide _ids in new order
    const pres = await Presentation.findById(req.params.id);
    if (!pres) return res.status(404).json({ success: false, message: 'Presentation not found' });

    const bySlideId = Object.fromEntries(pres.slides.map((s) => [String(s._id), s]));
    pres.slides = orderedIds.map((id, idx) => {
      const s = bySlideId[id];
      s.order = idx;
      return s;
    });
    await pres.save();
    return res.status(200).json({ success: true, data: pres.slides });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deletePresentation = async (req, res) => {
  try {
    const pres = await Presentation.findById(req.params.id);
    if (!pres) return res.status(404).json({ success: false, message: 'Presentation not found' });
    const isPrivileged = ['Owner', 'Admin'].includes(req.user.role);
    if (!pres.createdBy.equals(req.user._id) && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await pres.deleteOne();
    return res.status(200).json({ success: true, message: 'Presentation deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { create, getAll, getById, addSlide, updateSlide, deleteSlide, reorderSlides, deletePresentation };
