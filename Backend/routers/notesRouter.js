const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');


//แปะไว้ก่อน คิดอยู่ทำดีไหม
// เส้นทาง API สำหรับ Notes
router.post('/', notesController.createNote);
router.get('/', notesController.getAllNotes);
router.get('/:id', notesController.getNoteById);
router.put('/:id', notesController.updateNote);
router.delete('/:id', notesController.deleteNote);

module.exports = router;
