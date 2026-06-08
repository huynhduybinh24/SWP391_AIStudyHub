package com.lumiedu.ai.service.impl;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.lumiedu.ai.dto.QuizResponse;
import com.lumiedu.ai.dto.QuizQuestionResponse;
import com.lumiedu.ai.dto.QuizSubmitResponse;
import com.lumiedu.ai.entity.*;
import com.lumiedu.ai.repository.*;
import com.lumiedu.ai.service.AiAssistantService;
import com.lumiedu.ai.service.AiLimitService;
import com.lumiedu.ai.service.DocumentChunkingService;
import com.lumiedu.ai.service.OpenAiService;
import com.lumiedu.ai.service.OpenAiService.ChatMessageDto;
import com.lumiedu.ai.service.OpenAiService.OpenAiResponse;
import com.lumiedu.ai.service.GeminiService;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class AiAssistantServiceImpl implements AiAssistantService {

    private final AiSummaryRepository aiSummaryRepository;
    private final AiChatSessionRepository aiChatSessionRepository;
    private final AiChatMessageRepository aiChatMessageRepository;
    private final FlashcardRepository flashcardRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final DocumentRepository documentRepository;

    private final DocumentChunkRepository documentChunkRepository;
    private final AiUsageLogRepository aiUsageLogRepository;
    private final StudyPlanRepository studyPlanRepository;

    private final OpenAiService openAiService;
    private final DocumentChunkingService documentChunkingService;
    private final AiLimitService aiLimitService;
    private final GeminiService geminiService;

    private final Gson gson = new Gson();

    @Override
    public AiSummary generateSummary(Long documentId, String language) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();

        // 1. Check cache
        Optional<AiSummary> existing = aiSummaryRepository.findByDocumentIdAndLanguage(documentId, lang);
        if (existing.isPresent()) {
            return existing.get();
        }

        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) {
            throw new IllegalArgumentException("Document not found.");
        }

        // 2. Ensure chunks exist
        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(documentId);
        if (chunks.isEmpty()) {
            documentChunkingService.chunkAndIndexDocument(documentId);
            chunks = documentChunkRepository.findByDocumentId(documentId);
        }

        // 3. Build summary context from first few chunks
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(chunks.size(), 3); i++) {
            sb.append(chunks.get(i).getContent()).append("\n");
        }
        String context = sb.toString();

        // 4. Construct prompt
        List<ChatMessageDto> messages = new ArrayList<>();
        messages.add(ChatMessageDto.builder()
                .role("system")
                .content("You are a helpful educational AI assistant. Summarize the user's document in the requested language: " + lang + ". "
                        + "You must respond with a JSON object containing exactly two fields: "
                        + "'summaryText' (a paragraph summary of the document) and "
                        + "'summaryBullets' (a JSON array of key bullet points, max 5 bullets).")
                .build());
        messages.add(ChatMessageDto.builder()
                .role("user")
                .content("Document Subject: " + doc.getSubject() + "\nDocument Title: " + doc.getTitle() + "\n\nContent:\n" + context)
                .build());

        // 5. Call OpenAI
        OpenAiResponse response = openAiService.chat(messages, true);

        // 6. Log usage
        Long userId = doc.getUserId() != null ? doc.getUserId() : 1L;
        saveUsageLog(userId, "SUMMARY", response);

        // 7. Parse response
        String summaryText = "";
        String summaryBulletsJson = "";
        try {
            JsonObject jsonObj = gson.fromJson(response.getContent(), JsonObject.class);
            summaryText = jsonObj.get("summaryText").getAsString();
            JsonElement bulletsElem = jsonObj.get("summaryBullets");
            if (bulletsElem.isJsonArray()) {
                summaryBulletsJson = gson.toJson(bulletsElem.getAsJsonArray());
            } else {
                summaryBulletsJson = bulletsElem.getAsString();
            }
        } catch (Exception e) {
            System.err.println("Failed to parse summary JSON response: " + e.getMessage());
            // Fallback
            summaryText = response.getContent();
            summaryBulletsJson = gson.toJson(Arrays.asList("Tổng quan kiến thức cốt lõi.", "Chi tiết phương pháp và bài học."));
        }

        AiSummary summary = AiSummary.builder()
                .documentId(documentId)
                .language(lang)
                .summaryText(summaryText)
                .summaryBullets(summaryBulletsJson)
                .build();

        return aiSummaryRepository.save(summary);
    }

    @Override
    public AiSummary getSummary(Long documentId, String language) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        return aiSummaryRepository.findByDocumentIdAndLanguage(documentId, lang)
                .orElseGet(() -> generateSummary(documentId, lang));
    }

    @Override
    public AiChatSession createOrGetChatSession(List<Long> documentIds, Long userId) {
        if (documentIds == null || documentIds.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất một tài liệu nguồn.");
        }

        // Sort documentIds to ensure consistent matching
        List<Long> sortedIds = new ArrayList<>(documentIds);
        Collections.sort(sortedIds);

        // Find user's sessions ordered by update time
        List<AiChatSession> userSessions = aiChatSessionRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        for (AiChatSession s : userSessions) {
            List<Long> sessionDocIds = new ArrayList<>();
            if (s.getDocuments() != null) {
                for (Document d : s.getDocuments()) {
                    sessionDocIds.add(d.getId());
                }
            }
            Collections.sort(sessionDocIds);
            
            if (sessionDocIds.equals(sortedIds)) {
                return s;
            }
        }

        // If not found, create new session
        List<Document> docs = new ArrayList<>();
        StringBuilder titleBuilder = new StringBuilder();
        for (int i = 0; i < documentIds.size(); i++) {
            Long docId = documentIds.get(i);
            Document doc = documentRepository.findById(docId).orElse(null);
            if (doc != null) {
                docs.add(doc);
                if (titleBuilder.length() > 0) {
                    titleBuilder.append(", ");
                }
                titleBuilder.append(doc.getTitle());
            }
        }

        String title = titleBuilder.toString();
        if (title.length() > 255) {
            title = title.substring(0, 252) + "...";
        }
        if (title.isEmpty()) {
            title = "Thảo luận tài liệu";
        }

        Long firstDocId = documentIds.get(0);

        AiChatSession session = AiChatSession.builder()
                .documentId(firstDocId)
                .userId(userId)
                .title(title)
                .documents(docs)
                .build();

        return aiChatSessionRepository.save(session);
    }

    @Override
    public List<AiChatMessage> getChatHistory(Long sessionId) {
        return aiChatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    @Override
    public AiChatMessage sendMessage(Long sessionId, String messageText, boolean thinkingMode) {
        AiChatSession session = aiChatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Chat session not found."));

        // 1. Check billing limit
        if (!aiLimitService.isWithinDailyLimit(session.getUserId(), "CHAT")) {
            throw new RuntimeException("Bạn đã vượt quá hạn mức sử dụng AI Chat hàng ngày của gói dịch vụ hiện tại.");
        }

        // Save User Message
        AiChatMessage userMessage = AiChatMessage.builder()
                .sessionId(sessionId)
                .sender("USER")
                .messageText(messageText)
                .build();
        aiChatMessageRepository.save(userMessage);

        // 2. Ensure chunks exist, then perform RAG search
        String ragContext = "";
        StringBuilder docMetaContext = new StringBuilder();
        List<Document> docObjects = new ArrayList<>();

        if (session.getDocuments() != null && !session.getDocuments().isEmpty()) {
            docObjects.addAll(session.getDocuments());
        } else if (session.getDocumentId() != null) {
            Document doc = documentRepository.findById(session.getDocumentId()).orElse(null);
            if (doc != null) {
                docObjects.add(doc);
            }
        }

        List<Long> docIds = new ArrayList<>();
        for (Document doc : docObjects) {
            docIds.add(doc.getId());
            docMetaContext.append("Tài liệu: ").append(doc.getTitle());
            if (doc.getSubject() != null) docMetaContext.append(" | Môn học: ").append(doc.getSubject());
            if (doc.getDescription() != null && !doc.getDescription().isEmpty()) {
                docMetaContext.append("\nMô tả: ").append(doc.getDescription());
            }
            docMetaContext.append("\n");
            
            // Auto-index chunks if not yet indexed
            List<DocumentChunk> existingChunks = documentChunkRepository.findByDocumentId(doc.getId());
            if (existingChunks.isEmpty()) {
                try {
                    documentChunkingService.chunkAndIndexDocument(doc.getId());
                    System.out.println("Auto-indexed chunks for document: " + doc.getTitle());
                } catch (Exception e) {
                    System.err.println("Failed to auto-index chunks for doc " + doc.getId() + ": " + e.getMessage());
                }
            }
        }

        if (!docIds.isEmpty()) {
            ragContext = performRagSearch(docIds, messageText);
        }

        // 3. Gather chat history (last 10 messages)
        List<AiChatMessage> history = aiChatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        if (history.size() > 10) {
            history = history.subList(history.size() - 10, history.size());
        }

        // 4. Construct messages for Gemini
        List<ChatMessageDto> promptMsgs = new ArrayList<>();
        String systemInstruction = "You are a friendly AI study assistant named LumiEdu AI. "
                + "Help the student understand and discuss their documents. "
                + "Answer primarily in Vietnamese unless the user writes in another language. ";
        if (!docMetaContext.isEmpty()) {
            systemInstruction += "\n\nThe student has attached the following documents for this session:\n" + docMetaContext;
        }
        if (!ragContext.isEmpty()) {
            systemInstruction += "\n\nHere is relevant content extracted from the documents to help you answer:\n" + ragContext;
        } else if (!docMetaContext.isEmpty()) {
            systemInstruction += "\n\nNote: The full text of the documents is not yet available for search, but please use the document titles and metadata above to help the student as best you can.";
        }
        if (thinkingMode) {
            systemInstruction += " Think step-by-step and write your reasoning inside a <thought>...</thought> tag FIRST, then write the response.";
        }

        promptMsgs.add(ChatMessageDto.builder().role("system").content(systemInstruction).build());

        for (AiChatMessage msg : history) {
            String role = "USER".equalsIgnoreCase(msg.getSender()) ? "user" : "assistant";
            String content = msg.getMessageText();
            if ("assistant".equals(role) && msg.getThought() != null && !msg.getThought().trim().isEmpty()) {
                content = "<thought>\n" + msg.getThought() + "\n</thought>\n" + content;
            }
            promptMsgs.add(ChatMessageDto.builder().role(role).content(content).build());
        }

        // 5. Call Gemini
        OpenAiResponse response = geminiService.chat(promptMsgs, false);

        // 6. Log usage
        saveUsageLog(session.getUserId(), "CHAT", response);

        // 7. Save and return AI Message
        AiChatMessage aiMessage = AiChatMessage.builder()
                .sessionId(sessionId)
                .sender("AI")
                .messageText(response.getContent())
                .thought(response.getThought())
                .build();

        return aiChatMessageRepository.save(aiMessage);
    }

    @Override
    public List<Flashcard> generateFlashcards(Long documentId) {
        flashcardRepository.deleteByDocumentId(documentId);

        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) {
            throw new IllegalArgumentException("Document not found.");
        }

        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(documentId);
        if (chunks.isEmpty()) {
            documentChunkingService.chunkAndIndexDocument(documentId);
            chunks = documentChunkRepository.findByDocumentId(documentId);
        }

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(chunks.size(), 3); i++) {
            sb.append(chunks.get(i).getContent()).append("\n");
        }
        String context = sb.toString();

        List<ChatMessageDto> messages = new ArrayList<>();
        messages.add(ChatMessageDto.builder()
                .role("system")
                .content("You are an educational AI assistant. Create 5 useful study flashcards based on the document text. "
                        + "You must respond with a JSON object containing a 'flashcards' array. "
                        + "Each flashcard must have two fields: 'front' (question or term) and 'back' (definition or explanation).")
                .build());
        messages.add(ChatMessageDto.builder()
                .role("user")
                .content("Create flashcards based on this text:\n\n" + context)
                .build());

        OpenAiResponse response = openAiService.chat(messages, true);
        saveUsageLog(doc.getUserId() != null ? doc.getUserId() : 1L, "FLASHCARD", response);

        List<Flashcard> list = new ArrayList<>();
        try {
            JsonObject jsonObj = gson.fromJson(response.getContent(), JsonObject.class);
            JsonArray arr = jsonObj.getAsJsonArray("flashcards");
            for (int i = 0; i < arr.size(); i++) {
                JsonObject item = arr.get(i).getAsJsonObject();
                list.add(Flashcard.builder()
                        .documentId(documentId)
                        .question(item.get("front").getAsString())
                        .answer(item.get("back").getAsString())
                        .build());
            }
        } catch (Exception e) {
            System.err.println("Failed to parse flashcards JSON response: " + e.getMessage());
            list.add(new Flashcard(null, documentId, "Mẫu thiết kế Singleton dùng để làm gì?", "Đảm bảo một lớp chỉ có duy nhất một thực thể."));
            list.add(new Flashcard(null, documentId, "Mẫu thiết kế Observer hoạt động theo cơ chế nào?", "Mối quan hệ phụ thuộc một-nhiều giữa các đối tượng."));
        }

        return flashcardRepository.saveAll(list);
    }

    @Override
    public List<QuizQuestion> generateQuiz(Long documentId, String difficulty, int count, String customPrompt) {
        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) {
            throw new IllegalArgumentException("Document not found.");
        }

        Long userId = doc.getUserId() != null ? doc.getUserId() : 1L;
        // 1. Check billing limit
        if (!aiLimitService.isWithinDailyLimit(userId, "QUIZ")) {
            throw new RuntimeException("Bạn đã vượt quá hạn mức sử dụng AI Quiz hàng ngày của gói dịch vụ hiện tại.");
        }

        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(documentId);
        if (chunks.isEmpty()) {
            documentChunkingService.chunkAndIndexDocument(documentId);
            chunks = documentChunkRepository.findByDocumentId(documentId);
        }

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(chunks.size(), 4); i++) {
            sb.append(chunks.get(i).getContent()).append("\n");
        }
        String context = sb.toString();

        List<ChatMessageDto> messages = new ArrayList<>();
        messages.add(ChatMessageDto.builder()
                .role("system")
                .content("You are an educational AI assistant. Create a quiz with exactly " + count + " multiple choice questions based on the document. "
                        + "The difficulty level should be: " + difficulty + ". "
                        + "Custom request: " + customPrompt + ". "
                        + "You must respond with a JSON object containing a 'questions' array. "
                        + "Each question must contain: "
                        + "'q' (question string), "
                        + "'options' (JSON array of 4 option strings), "
                        + "'answer' (index of the correct option: 0, 1, 2, or 3), "
                        + "'explain' (detailed explanation string).")
                .build());
        messages.add(ChatMessageDto.builder()
                .role("user")
                .content("Create quiz for this document text:\n\n" + context)
                .build());

        OpenAiResponse response = openAiService.chat(messages, true);
        saveUsageLog(userId, "QUIZ", response);

        Quiz quiz = Quiz.builder()
                .documentId(documentId)
                .title("Quiz for " + doc.getTitle())
                .promptUsed(customPrompt)
                .build();
        quiz = quizRepository.save(quiz);

        List<QuizQuestion> questions = new ArrayList<>();
        try {
            JsonObject jsonObj = gson.fromJson(response.getContent(), JsonObject.class);
            JsonArray arr = jsonObj.getAsJsonArray("questions");
            for (int i = 0; i < arr.size(); i++) {
                JsonObject item = arr.get(i).getAsJsonObject();
                JsonArray optsArr = item.getAsJsonArray("options");
                List<String> options = new ArrayList<>();
                for (int j = 0; j < optsArr.size(); j++) {
                    options.add(optsArr.get(j).getAsString());
                }

                questions.add(QuizQuestion.builder()
                        .quiz(quiz)
                        .questionText(item.get("q").getAsString())
                        .options(gson.toJson(options))
                        .answerIndex(item.get("answer").getAsInt())
                        .explanation(item.get("explain").getAsString())
                        .build());
            }
        } catch (Exception e) {
            System.err.println("Failed to parse quiz JSON response: " + e.getMessage());
            // Fallback
            questions.add(QuizQuestion.builder()
                    .quiz(quiz)
                    .questionText("Câu hỏi trắc nghiệm ôn tập về " + doc.getSubject())
                    .options(gson.toJson(Arrays.asList("Đáp án A", "Đáp án B (Đúng)", "Đáp án C", "Đáp án D")))
                    .answerIndex(1)
                    .explanation("Đây là giải thích đáp án mẫu vì lỗi phân tích dữ liệu AI.")
                    .build());
        }

        return quizQuestionRepository.saveAll(questions);
    }

    @Override
    public List<QuizQuestion> modifyQuizWithAi(Long documentId, String prompt) {
        return generateQuiz(documentId, "medium", 5, prompt);
    }

    @Override
    public List<QuizQuestion> getQuiz(Long documentId) {
        Optional<Quiz> latestQuizOpt = quizRepository.findFirstByDocumentIdOrderByCreatedAtDesc(documentId);
        if (latestQuizOpt.isEmpty()) {
            return generateQuiz(documentId, "medium", 5, "");
        }
        return quizQuestionRepository.findByQuizId(latestQuizOpt.get().getId());
    }

    @Override
    public QuizResponse getQuizResponse(Long documentId) {
        List<Quiz> quizzes = quizRepository.findByDocumentId(documentId);
        if (quizzes.isEmpty()) {
            generateQuiz(documentId, "medium", 5, "");
            quizzes = quizRepository.findByDocumentId(documentId);
        }

        List<QuizQuestion> pool = new ArrayList<>();
        for (Quiz q : quizzes) {
            pool.addAll(quizQuestionRepository.findByQuizId(q.getId()));
        }

        Collections.shuffle(pool);

        int selectCount = Math.min(pool.size(), 5);
        List<QuizQuestion> selectedQuestions = pool.subList(0, selectCount);

        List<QuizQuestionResponse> questionResponses = new ArrayList<>();
        for (QuizQuestion qq : selectedQuestions) {
            List<String> optionsList;
            try {
                optionsList = gson.fromJson(qq.getOptions(), new com.google.gson.reflect.TypeToken<List<String>>(){}.getType());
            } catch (Exception e) {
                optionsList = Arrays.asList("Option A", "Option B", "Option C", "Option D");
            }

            questionResponses.add(QuizQuestionResponse.builder()
                    .id(qq.getId())
                    .text(qq.getQuestionText())
                    .options(optionsList)
                    .answerIndex(qq.getAnswerIndex())
                    .explanation(qq.getExplanation())
                    .build());
        }

        Optional<Quiz> latestQuizOpt = quizRepository.findFirstByDocumentIdOrderByCreatedAtDesc(documentId);
        Quiz latestQuiz = latestQuizOpt.orElse(quizzes.get(0));

        return QuizResponse.builder()
                .id(latestQuiz.getId())
                .documentId(documentId)
                .title(latestQuiz.getTitle())
                .promptUsed(latestQuiz.getPromptUsed())
                .questions(questionResponses)
                .build();
    }

    @Override
    public QuizResponse regenerateQuizResponse(Long documentId, String prompt) {
        generateQuiz(documentId, "medium", 5, prompt);
        return getQuizResponse(documentId);
    }

    @Override
    public QuizSubmitResponse submitQuiz(Long userId, Long documentId, Map<Long, Integer> answers) {
        int correctCount = 0;
        int totalQuestions = answers.size();
        Map<Long, Integer> correctAnswers = new HashMap<>();
        Map<Long, String> explanations = new HashMap<>();

        for (Map.Entry<Long, Integer> entry : answers.entrySet()) {
            Long questionId = entry.getKey();
            Integer selectedIndex = entry.getValue();

            Optional<QuizQuestion> qqOpt = quizQuestionRepository.findById(questionId);
            if (qqOpt.isPresent()) {
                QuizQuestion qq = qqOpt.get();
                correctAnswers.put(questionId, qq.getAnswerIndex());
                explanations.put(questionId, qq.getExplanation());

                if (selectedIndex != null && selectedIndex.equals(qq.getAnswerIndex())) {
                    correctCount++;
                }
            }
        }

        int scorePercentage = totalQuestions > 0 ? Math.round(((float) correctCount / totalQuestions) * 100) : 0;

        Optional<Quiz> latestQuizOpt = quizRepository.findFirstByDocumentIdOrderByCreatedAtDesc(documentId);
        Long latestQuizId = latestQuizOpt.map(Quiz::getId).orElse(null);

        QuizAttempt attempt = QuizAttempt.builder()
                .userId(userId)
                .documentId(documentId)
                .quizId(latestQuizId)
                .score(scorePercentage)
                .submittedAnswers(gson.toJson(answers))
                .build();
        attempt = quizAttemptRepository.save(attempt);

        return QuizSubmitResponse.builder()
                .attemptId(attempt.getId())
                .score(scorePercentage)
                .correctCount(correctCount)
                .totalQuestions(totalQuestions)
                .correctAnswers(correctAnswers)
                .explanations(explanations)
                .build();
    }

    @Override
    public StudyPlan generateStudyPlan(Long userId, String subject, String goal, int durationWeeks, List<Long> documentIds) {
        StringBuilder docContextBuilder = new StringBuilder();
        Set<Document> sourceDocs = new HashSet<>();

        if (documentIds != null && !documentIds.isEmpty()) {
            for (Long documentId : documentIds) {
                if (documentId == null) continue;
                Document doc = documentRepository.findById(documentId).orElse(null);
                if (doc != null) {
                    sourceDocs.add(doc);
                    List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(documentId);
                    if (chunks.isEmpty()) {
                        documentChunkingService.chunkAndIndexDocument(documentId);
                        chunks = documentChunkRepository.findByDocumentId(documentId);
                    }
                    for (int i = 0; i < Math.min(chunks.size(), 2); i++) {
                        docContextBuilder.append("[").append(doc.getTitle()).append("]: ")
                                         .append(chunks.get(i).getContent()).append("\n");
                    }
                }
            }
        }
        String docContext = docContextBuilder.toString();

        List<ChatMessageDto> messages = new ArrayList<>();
        messages.add(ChatMessageDto.builder()
                .role("system")
                .content("You are an expert academic counselor. Generate a structured week-by-week study plan roadmap in markdown. "
                        + "You must respond with a JSON object containing: "
                        + "'title' (a concise name for the plan), "
                        + "'subject' (the academic subject), "
                        + "'planText' (the markdown roadmap text, including weekly goals and active recall milestones), "
                        + "'curriculum' (a JSON array representing modules of study). "
                        + "Each module object in the 'curriculum' array must contain:\n"
                        + "- 'title' (module/week title),\n"
                        + "- 'description' (module description),\n"
                        + "- 'lessons' (array of lesson objects, each having 'title', 'duration' (e.g., '25 min'), "
                        + "'type' ('reading' or 'quiz' or 'video' or 'practice'), "
                        + "'linkedDocName' (if reading type, matching the reference material filename, e.g. Co_Hoc_Luong_Tu_Chuong2.pdf), "
                        + "and 'pageRange' (optional page range, e.g., 'Trang 15 - 30')).")
                .build());

        String userQuery = "Subject: " + subject + "\nGoal: " + goal + "\nDuration: " + durationWeeks + " weeks.";
        if (!docContext.isEmpty()) {
            userQuery += "\n\nReference Material:\n" + docContext;
        }
        messages.add(ChatMessageDto.builder().role("user").content(userQuery).build());

        OpenAiResponse response = openAiService.chat(messages, true);
        saveUsageLog(userId, "STUDY_PLAN", response);

        String title = "Kế hoạch học tập " + subject;
        String planText = response.getContent();
        String curriculumJson = "";

        try {
            JsonObject jsonObj = gson.fromJson(response.getContent(), JsonObject.class);
            title = jsonObj.get("title").getAsString();
            planText = jsonObj.get("planText").getAsString();
            if (jsonObj.has("curriculum")) {
                curriculumJson = gson.toJson(jsonObj.get("curriculum"));
            }
        } catch (Exception e) {
            System.err.println("Failed to parse study plan JSON: " + e.getMessage());
        }

        StudyPlan plan = StudyPlan.builder()
                .userId(userId)
                .title(title)
                .subject(subject)
                .planText(planText)
                .curriculumJson(curriculumJson)
                .documentId(documentIds != null && !documentIds.isEmpty() ? documentIds.get(0) : null)
                .sourceDocuments(sourceDocs)
                .build();

        return studyPlanRepository.save(plan);
    }

    @Override
    public List<StudyPlan> getStudyPlans(Long userId) {
        return studyPlanRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public List<AiChatSession> getUserSessions(Long userId) {
        return aiChatSessionRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    // --- Helpers ---

    private void saveUsageLog(Long userId, String featureType, OpenAiResponse response) {
        try {
            AiUsageLog log = AiUsageLog.builder()
                    .userId(userId)
                    .featureType(featureType)
                    .model("gpt-4o-mini")
                    .promptTokens(response.getPromptTokens())
                    .completionTokens(response.getCompletionTokens())
                    .costEstimate(response.getCostEstimate() != null ? response.getCostEstimate() : BigDecimal.ZERO)
                    .usageDate(LocalDate.now())
                    .build();
            aiUsageLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Failed to save AI Usage Log: " + e.getMessage());
        }
    }

    private String performRagSearch(List<Long> documentIds, String query) {
        if (documentIds == null || documentIds.isEmpty()) {
            return "";
        }
        
        List<DocumentChunk> chunks = new ArrayList<>();
        for (Long documentId : documentIds) {
            chunks.addAll(documentChunkRepository.findByDocumentId(documentId));
        }
        
        if (chunks.isEmpty()) {
            return "";
        }

        String[] keywords = query.toLowerCase().split("\\s+");
        
        class ChunkScore implements Comparable<ChunkScore> {
            DocumentChunk chunk;
            int score;
            
            ChunkScore(DocumentChunk chunk, int score) {
                this.chunk = chunk;
                this.score = score;
            }
            
            @Override
            public int compareTo(ChunkScore o) {
                return Integer.compare(o.score, this.score); // descending
            }
        }
        
        List<ChunkScore> scoredChunks = new ArrayList<>();
        for (DocumentChunk chunk : chunks) {
            int score = 0;
            String contentLower = chunk.getContent().toLowerCase();
            for (String kw : keywords) {
                if (kw.length() > 2 && contentLower.contains(kw)) {
                    score++;
                }
            }
            if (score > 0) {
                scoredChunks.add(new ChunkScore(chunk, score));
            }
        }
        
        if (scoredChunks.isEmpty()) {
            StringBuilder fallback = new StringBuilder();
            Map<Long, DocumentChunk> firstChunks = new HashMap<>();
            for (DocumentChunk chunk : chunks) {
                firstChunks.putIfAbsent(chunk.getDocumentId(), chunk);
            }
            for (DocumentChunk firstChunk : firstChunks.values()) {
                fallback.append(firstChunk.getContent()).append("\n\n");
            }
            return fallback.toString();
        }
        
        Collections.sort(scoredChunks);
        StringBuilder result = new StringBuilder();
        int limit = Math.min(scoredChunks.size(), 5);
        for (int i = 0; i < limit; i++) {
            DocumentChunk c = scoredChunks.get(i).chunk;
            result.append("--- Source Document ID: ").append(c.getDocumentId()).append(" ---\n");
            result.append(c.getContent()).append("\n\n");
        }
        
        return result.toString();
    }
}
