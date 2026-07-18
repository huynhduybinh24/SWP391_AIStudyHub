package com.lumiedu.document.controller;

import com.lumiedu.document.entity.Semester;
import com.lumiedu.document.repository.SemesterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/semesters")
@RequiredArgsConstructor
public class SemesterController {

    private final SemesterRepository semesterRepository;

    @GetMapping
    public ResponseEntity<List<Semester>> getSemesters(@RequestParam(required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.ok(semesterRepository.findAll());
        }
        return ResponseEntity.ok(semesterRepository.findAllByUserScope(userId));
    }

    @PostMapping
    public ResponseEntity<Semester> createSemester(@RequestBody Semester semester) {
        if (semester.getName() == null || semester.getName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Semester saved = semesterRepository.save(semester);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Semester> updateSemester(@PathVariable Long id, @RequestBody Semester semesterDetails) {
        Semester semester = semesterRepository.findById(id).orElse(null);
        if (semester == null) {
            return ResponseEntity.notFound().build();
        }
        if (semester.getUserId() == null) {
            return ResponseEntity.status(403).build(); // System semesters are read-only
        }
        semester.setName(semesterDetails.getName());
        Semester updated = semesterRepository.save(semester);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSemester(@PathVariable Long id) {
        Semester semester = semesterRepository.findById(id).orElse(null);
        if (semester == null) {
            return ResponseEntity.notFound().build();
        }
        if (semester.getUserId() == null) {
            return ResponseEntity.status(403).build(); // System semesters cannot be deleted
        }
        semesterRepository.delete(semester);
        return ResponseEntity.ok().build();
    }
}
