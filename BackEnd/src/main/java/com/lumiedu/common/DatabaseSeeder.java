package com.lumiedu.common;

import com.lumiedu.document.entity.Semester;
import com.lumiedu.document.entity.Subject;
import com.lumiedu.document.repository.SemesterRepository;
import com.lumiedu.document.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final SemesterRepository semesterRepository;
    private final SubjectRepository subjectRepository;

    @Override
    public void run(String... args) throws Exception {
        seedSemesters();
        seedSubjects();
    }

    private void seedSemesters() {
        if (semesterRepository.count() == 0) {
            log.info("Seeding default semesters...");
            for (int i = 1; i <= 9; i++) {
                semesterRepository.save(Semester.builder()
                        .name("K" + i)
                        .userId(null)
                        .build());
            }
            log.info("Default semesters seeded successfully.");
        }
    }

    private void seedSubjects() {
        if (subjectRepository.count() == 0) {
            log.info("Seeding default subjects...");
            
            // Semester 1 (K1)
            saveSubject("Programming Fundamentals", "PRF192", "K1", "SE,AI");
            saveSubject("Mathematics for Engineering", "MAE101", "K1", "SE,AI");
            saveSubject("Computer Organization", "CEA201", "K1", "SE,AI");
            saveSubject("Introduction to Computer Science", "CSI104", "K1", "SE,AI");
            saveSubject("Introduction to Management", "MGT103", "K1", "BA");
            saveSubject("Microeconomics", "ECO111", "K1", "BA");
            saveSubject("Financial Mathematics", "FMA101", "K1", "BA");

            // Semester 2 (K2)
            saveSubject("Object-Oriented Programming", "PRO192", "K2", "SE,AI");
            saveSubject("Discrete Mathematics", "MAD101", "K2", "SE,AI");
            saveSubject("Operating Systems", "OSG202", "K2", "SE,AI");
            saveSubject("Communication Skills", "SSG104", "K2", "SE,AI,BA");
            saveSubject("Basic Marketing", "MKT101", "K2", "BA");
            saveSubject("Macroeconomics", "ECO121", "K2", "BA");
            saveSubject("Art Management", "AMG111", "K2", "BA");

            // Semester 3 (K3)
            saveSubject("Data Structures and Algorithms", "CSD201", "K3", "SE,AI");
            saveSubject("Database Systems", "DBI202", "K3", "SE,AI,BA");
            saveSubject("OOP Java Lab", "LAB211", "K3", "SE");
            saveSubject("Machine Learning", "AIL302M", "K3", "AI");
            saveSubject("Principles of Accounting", "ACC101", "K3", "BA");
            saveSubject("Corporate Finance", "FIN201", "K3", "BA");
            saveSubject("Business Law", "BUL201", "K3", "BA");

            // Semester 4 (K4)
            saveSubject("Basic Cross-Platform Application (.NET)", "PRN211", "K4", "SE");
            saveSubject("Introduction to Software Engineering", "SWE201", "K4", "SE");
            saveSubject("Japanese Language 1", "JPD113", "K4", "SE,AI");
            saveSubject("Artificial Intelligence Project", "AIP301", "K4", "AI");
            saveSubject("Probability and Statistics", "MTH202", "K4", "SE,AI");
            saveSubject("Human Resource Management", "HRM201", "K4", "BA");
            saveSubject("Organizational Behavior", "OBH201", "K4", "BA");
            saveSubject("Marketing Research", "MRF301", "K4", "BA");

            // Semester 5 (K5)
            saveSubject("Software Development Project", "SWP391", "K5", "SE,AI");
            saveSubject("Software Architecture and Design", "SWD392", "K5", "SE");
            saveSubject("Software Testing", "SWT301", "K5", "SE");
            saveSubject("Deep Learning", "DLN301", "K5", "AI");
            saveSubject("Business Information Systems", "BIS301", "K5", "BA");
            saveSubject("Entrepreneurship", "ENT301", "K5", "SE,AI,BA");
            saveSubject("Production and Operations Management", "POM201", "K5", "BA");

            // Semester 6 (K6)
            saveSubject("On-the-Job Training (OJT)", "OJT202", "K6", "SE,AI,BA");

            // Semester 7 (K7)
            saveSubject("Mobile Programming", "PRM392", "K7", "SE,AI");
            saveSubject("Advanced Cross-Platform Application (.NET)", "PRN221", "K7", "SE");
            saveSubject("Web Development Project", "WDP301", "K7", "SE");
            saveSubject("Natural Language Processing", "NLP301", "K7", "AI");
            saveSubject("Computer Vision Project", "CVP301", "K7", "AI");
            saveSubject("International Business Management", "IBM301", "K7", "BA");
            saveSubject("Supply Chain Management", "SCM301", "K7", "BA");
            saveSubject("Business Research Methods", "BRM301", "K7", "BA");

            // Semester 8 (K8)
            saveSubject("Capstone Project Preparation (SE)", "SEP490", "K8", "SE");
            saveSubject("Capstone Project Preparation (AI)", "CAP490", "K8", "AI");
            saveSubject("Capstone Project Preparation (BA)", "BAP490", "K8", "BA");
            saveSubject("Experiential Entrepreneurship 1", "EXE101", "K8", "SE,AI,BA");
            saveSubject("Information Assurance & Security", "IAS301", "K8", "SE");
            saveSubject("Big Data Analytics", "BDA301", "K8", "AI");
            saveSubject("Strategic Management", "SMA301", "K8", "BA");

            // Semester 9 (K9)
            saveSubject("Capstone Project Graduation (SE)", "SEP490_DEF", "K9", "SE");
            saveSubject("Capstone Project Graduation (AI)", "CAP490_DEF", "K9", "AI");
            saveSubject("Capstone Project Graduation (BA)", "BAP490_DEF", "K9", "BA");
            saveSubject("Experiential Entrepreneurship 2", "EXE201", "K9", "SE,AI,BA");
            saveSubject("Project Management", "PMG201", "K9", "SE,AI");
            saveSubject("E-Business", "EBU301", "K9", "BA");

            log.info("Default subjects seeded successfully.");
        }
    }

    private void saveSubject(String name, String code, String semesterName, String majors) {
        subjectRepository.save(Subject.builder()
                .name(name)
                .code(code)
                .semesterName(semesterName)
                .majors(majors)
                .userId(null)
                .build());
    }
}
