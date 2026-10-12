import { VoiceLibraryService } from './service.js';

export class VoiceLibraryController {
  static getVoices(req, res) {
    const voices = VoiceLibraryService.getVoices(req.query);
    res.status(200).json({
      success: true,
      data: voices,
    });
  }

  static getVoice(req, res) {
    const voice = VoiceLibraryService.getVoiceById(req.params.id);
    res.status(200).json({
      success: true,
      data: voice,
    });
  }
}
