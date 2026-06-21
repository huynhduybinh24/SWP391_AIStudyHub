package com.lumiedu.document.controller;

import com.lumiedu.document.entity.Subject;
import com.lumiedu.document.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectRepository subjectRepository;

    @GetMapping
    public ResponseEntity<List<Subject>> getSubjects(
            @RequestParam(required = false) String semesterName,
            @RequestParam(required = false) Long userId) {
        
        if (semesterName == null || semesterName.isBlank()) {
            if (userId == null) {
                return ResponseEntity.ok(subjectRepository.findAll());
            }
            return ResponseEntity.ok(subjectRepository.findAllByUserScope(userId));
        }

        if (userId == null) {
            // Default to return all for the semester (system scope only)
            return ResponseEntity.ok(subjectRepository.findBySemesterNameAndUserScope(semesterName, -1L));
        }
        
        return ResponseEntity.ok(subjectRepository.findBySemesterNameAndUserScope(semesterName, userId));
    }

    @PostMapping
    public ResponseEntity<Subject> createSubject(@RequestBody Subject subject) {
        if (subject.getName() == null || subject.getName().isBlank() ||
            subject.getCode() == null || subject.getCode().isBlank() ||
            subject.getSemesterName() == null || subject.getSemesterName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Subject saved = subjectRepository.save(subject);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Subject> updateSubject(@PathVariable Long id, @RequestBody Subject subjectDetails) {
        Subject subject = subjectRepository.findById(id).orElse(null);
        if (subject == null) {
            return ResponseEntity.notFound().build();
        }
        if (subject.getUserId() == null) {
            return ResponseEntity.status(403).build(); // System subjects are read-only
        }
        subject.setName(subjectDetails.getName());
        subject.setCode(subjectDetails.getCode());
        subject.setMajors(subjectDetails.getMajors());
        Subject updated = subjectRepository.save(subject);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubject(@PathVariable Long id) {
        Subject subject = subjectRepository.findById(id).orElse(null);
        if (subject == null) {
            return ResponseEntity.notFound().build();
        }
        if (subject.getUserId() == null) {
            return ResponseEntity.status(403).build(); // System subjects cannot be deleted
        }
        subjectRepository.delete(subject);
        return ResponseEntity.ok().build();
    }
}
