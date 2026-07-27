package com.lumiedu.prompt.service.impl;

import com.lumiedu.prompt.entity.Prompt;
import com.lumiedu.prompt.entity.PromptReviewHistory;
import com.lumiedu.prompt.entity.PromptVersion;
import com.lumiedu.prompt.enums.ChangeType;
import com.lumiedu.prompt.enums.PromptCategory;
import com.lumiedu.prompt.enums.PromptVersionStatus;
import com.lumiedu.prompt.enums.ReviewAction;
import com.lumiedu.prompt.repository.PromptRepository;
import com.lumiedu.prompt.repository.PromptReviewHistoryRepository;
import com.lumiedu.prompt.repository.PromptVersionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Component
@Order(10)
@RequiredArgsConstructor
public class PromptSeeder implements CommandLineRunner {

    private final PromptRepository promptRepository;
    private final PromptVersionRepository promptVersionRepository;
    private final PromptReviewHistoryRepository promptReviewHistoryRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        seedPrompt(
                "DOCUMENT_SUMMARY",
                "Document Summary",
                "Prompt used to generate concise document summaries and key bullet points.",
                PromptCategory.GENERATION,
                """
                # Role
                You are a helpful educational AI assistant for LumiEdu.

                # Task
                Summarize the provided learning document in the requested language: {{language}}.

                # Context
                - Document Subject: {{subject}}
                - Document Title: {{title}}

                # Document Content
                {{content}}

                # Output Requirements
                You MUST respond with a valid JSON object containing exactly two fields:
                - `summaryText`: A comprehensive paragraph summary of the document.
                - `summaryBullets`: A JSON array of key bullet points (maximum 5 bullets).
                """
        );

        seedPrompt(
                "CHAT_QA",
                "Chatbot Q&A Assistant",
                "Prompt used for student Q&A conversational assistant.",
                PromptCategory.CHAT,
                """
                # Role
                You are a friendly AI study assistant named LumiEdu AI.

                # Task
                Answer the student's question accurately and helpfully using the provided learning document context.

                # Document Context
                {{context}}

                # Student Question
                {{question}}

                # Guidelines
                - Answer in the same language as the student's question unless requested otherwise.
                - Base your answer on the provided document context.
                """
        );

        seedPrompt(
                "QUIZ_GENERATION",
                "Quiz Question Generator",
                "Prompt used to generate multiple choice quiz questions from document context.",
                PromptCategory.GENERATION,
                """
                # Role
                You are an educational AI assistant specializing in assessment design.

                # Task
                Create a quiz with exactly {{count}} multiple choice questions based on the provided document content.

                # Configuration
                - Difficulty Level: {{difficulty}}
                - Language: {{language}}

                # Document Content
                {{content}}

                # Output Format
                Return a valid JSON object with a `questions` array. Each question element MUST contain:
                - `question`: The question text (string).
                - `options`: An array of exactly 4 option strings.
                - `correctAnswer`: The exact string matching the correct option.
                - `explanation`: Detailed explanation of why the answer is correct.
                """
        );

        seedPrompt(
                "FLASHCARD_GENERATION",
                "Flashcard Generator",
                "Prompt used to create study flashcards from document content.",
                PromptCategory.GENERATION,
                """
                # Role
                You are an educational AI assistant specializing in memory retrieval techniques.

                # Task
                Create {{count}} useful study flashcards based on the provided document text.

                # Configuration
                - Language: {{language}}

                # Document Content
                {{content}}

                # Output Format
                Return a valid JSON array of objects. Each object MUST contain:
                - `front`: A concise question or key concept term.
                - `back`: Clear definition, explanation, or answer.
                """
        );

        seedPrompt(
                "MINDMAP_GENERATION",
                "Mermaid Mindmap Generator",
                "Prompt used to generate structural Mermaid.js mind maps.",
                PromptCategory.GENERATION,
                """
                # Role
                You are an expert mind mapping AI visualizer.

                # Task
                Generate a structural mind map in Mermaid.js syntax based on the provided document context.

                # Configuration
                - Language: {{language}}

                # Document Context
                {{content}}

                # Output Format
                Return a valid JSON object containing:
                - `title`: Short descriptive title for the mind map.
                - `mermaidCode`: Valid Mermaid.js mindmap definition code starting with `mindmap`.
                """
        );

        seedPrompt(
                "SLIDE_GENERATION",
                "Slide & Key Takeaways Generator",
                "Prompt used to extract infographic points and slide deck outlines.",
                PromptCategory.GENERATION,
                """
                # Role
                You are a graphic designer and slide outline AI.

                # Task
                Extract 3 to 5 core stats, key slide steps, or numerical takeaways from the documents.

                # Configuration
                - Language: {{language}}

                # Document Context
                {{content}}

                # Output Format
                Return a valid JSON object containing:
                - `title`: Infographic or Slide Deck Title.
                - `subtitle`: Subtitle or brief overview summary.
                - `items`: JSON array of key takeaways, each with `label`, `value`, `description`, and `iconName`.
                """
        );

        seedPrompt(
                "STUDY_PLAN",
                "Academic Roadmap Study Plan Generator",
                "Prompt used to construct week-by-week study plans for students.",
                PromptCategory.ACADEMIC,
                """
                # Role
                You are an expert academic counselor and curriculum planner.

                # Task
                Generate a structured week-by-week study plan roadmap based on student parameters and document context.

                # Student Parameters
                - Subject: {{subject}}
                - Total Duration: {{durationWeeks}} weeks
                - Target Goal: {{goal}}
                - Daily Commitment: {{dailyHours}} hours per day

                # Learning Material Context
                {{context}}

                # Output Format
                Return a valid JSON object containing:
                - `title`: Overall Study Plan Title.
                - `summary`: High-level roadmap summary.
                - `curriculum`: JSON array of weekly study modules (week number, topic, daily tasks, objectives).
                """
        );

        seedPrompt(
                "FAQ_GENERATION",
                "Document FAQ Generator",
                "Prompt used to extract common questions and answers from learning documents.",
                PromptCategory.GENERATION,
                """
                # Role
                You are an academic counselor and FAQ specialist.

                # Task
                Extract 5 common questions and comprehensive answers (FAQs) that students are likely to ask about the provided document.

                # Configuration
                - Language: {{language}}

                # Document Context
                {{content}}

                # Output Format
                Return a valid JSON array of objects, where each object contains:
                - `question`: A typical student question.
                - `answer`: Clear, accurate, and explanatory answer.
                """
        );

        seedPrompt(
                "DOCUMENT_MODERATION",
                "AI Content Moderation",
                "Prompt used for automated content moderation and safety evaluation of uploaded documents.",
                PromptCategory.MODERATION,
                """
                # Role
                You are an expert AI content moderator for the LumiEdu academic platform.

                # Task
                Evaluate the provided document text for appropriateness, academic relevance, and safety (checking for offensive material, hate speech, or spam).

                # Document Metadata
                - Title: {{title}}

                # Document Text
                {{content}}

                # Output Format
                Return a valid JSON object with:
                - `approved`: Boolean `true` if document is safe for study platform, `false` otherwise.
                - `reason`: Explanation of the moderation decision.
                - `flaggedCategory`: Category string if flagged (or `null` if approved).
                """
        );

        seedPrompt(
                "ASSIGNMENT_EVALUATION",
                "Assignment Rubric Evaluator",
                "Prompt used to evaluate student assignment submissions against rubric criteria.",
                PromptCategory.EVALUATION,
                """
                # Role
                You are an AI teaching assistant evaluating a student assignment submission.

                # Task
                Evaluate the student's assignment submission according to the provided assignment description and rubric.

                # Assignment Details
                - Course Code: {{courseCode}}
                - Assignment Topic: {{topic}}

                # Assignment Instructions & Rubric
                {{rubric}}

                # Student Submission
                {{submission}}

                # Output Format
                Return a valid JSON object with:
                - `score`: Overall numerical score (0 to 100).
                - `feedback`: Comprehensive constructive feedback for the student.
                - `strengths`: Array of student's key strengths.
                - `areasForImprovement`: Array of specific areas needing improvement.
                """
        );

        seedPrompt(
                "CODING_EVALUATION",
                "Programming Code Reviewer",
                "Prompt used to evaluate student programming code for correctness, clean code, and style.",
                PromptCategory.EVALUATION,
                """
                # Role
                You are a Senior Software Engineer and Automated Code Reviewer.

                # Task
                Evaluate the student's programming submission for correctness, code quality, clean code standards, and efficiency.

                # Task Specification & Language
                - Programming Language: {{language}}
                - Problem Title: {{problemTitle}}
                - Requirements: {{requirements}}

                # Student Source Code
                ```
                {{sourceCode}}
                ```

                # Output Format
                Return a valid JSON object containing:
                - `score`: Code score (0 to 100).
                - `correctnessScore`: Score for logic and correctness (0 to 100).
                - `codeStyleScore`: Score for clean code and readability (0 to 100).
                - `explanation`: Detailed code review breakdown.
                - `suggestions`: Array of concrete optimization and refactoring suggestions.
                """
        );
    }

    private void seedPrompt(String code, String name, String description, PromptCategory category, String markdownContent) {
        if (!promptRepository.existsByCode(code)) {
            log.info("Seeding initial prompt: {}", code);
            Prompt prompt = Prompt.builder()
                    .code(code)
                    .name(name)
                    .description(description)
                    .category(category)
                    .active(true)
                    .build();
            Prompt savedPrompt = promptRepository.save(prompt);

            PromptVersion version = PromptVersion.builder()
                    .prompt(savedPrompt)
                    .version("v1.0.0")
                    .markdownContent(markdownContent.trim())
                    .status(PromptVersionStatus.PUBLISHED)
                    .changeType(ChangeType.MAJOR)
                    .changeSummary("Initial system prompt migration")
                    .changeReason("Migrate legacy hard-coded prompt into database")
                    .publishedAt(LocalDateTime.now())
                    .build();
            PromptVersion savedVersion = promptVersionRepository.save(version);

            PromptReviewHistory history = PromptReviewHistory.builder()
                    .promptVersion(savedVersion)
                    .action(ReviewAction.PUBLISHED)
                    .comment("Initial system prompt v1.0.0 auto-published on startup")
                    .performedAt(LocalDateTime.now())
                    .build();
            promptReviewHistoryRepository.save(history);
        }
    }
}
