package com.lumiedu.ai.service.impl;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.lumiedu.ai.dto.ChatSourceDto;
import com.lumiedu.ai.dto.QuizResponse;
import com.lumiedu.ai.dto.QuizQuestionResponse;
import com.lumiedu.ai.dto.QuizSubmitResponse;
import com.lumiedu.ai.entity.*;
import com.lumiedu.ai.exception.AiApiException;
import com.lumiedu.ai.repository.*;
import com.lumiedu.ai.service.AiAssistantService;
import com.lumiedu.ai.service.AiDocumentAccessService;
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
    private final com.lumiedu.prompt.service.PromptEngineService promptEngineService;
    private final com.lumiedu.user.repository.UserRepository userRepository;
    private final AiDocumentAccessService aiDocumentAccessService;

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
        List<DocumentChunk> chunks = getOrWaitForChunks(documentId);
        if (chunks.isEmpty()) {
            return AiSummary.builder()
                    .documentId(documentId)
                    .language(lang)
                    .summaryText("Tài liệu đang được hệ thống phân tích và chia nhỏ dữ liệu. Vui lòng đợi trong giây lát và tải lại trang.")
                    .summaryBullets("[]")
                    .build();
        }

        // 3. Build summary context from first few chunks
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(chunks.size(), 3); i++) {
            sb.append(chunks.get(i).getContent()).append("\n");
        }
        String context = sb.toString();

        // 4. Construct prompt variables and execute via PromptEngineService
        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("language", lang);
        promptVars.put("subject", doc.getSubject() != null ? doc.getSubject() : "General");
        promptVars.put("title", doc.getTitle() != null ? doc.getTitle() : "Untitled Document");
        promptVars.put("content", context);

        Long userId = doc.getUserId() != null ? doc.getUserId() : 1L;
        com.lumiedu.user.entity.User currentUser = userRepository.findById(userId).orElse(null);

        com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "DOCUMENT_SUMMARY",
                promptVars,
                currentUser,
                currentUser != null ? currentUser.getEmail() : null,
                "DOCUMENT_SUMMARY",
                String.valueOf(documentId),
                "doc-v" + documentId,
                true
        );

        String rawResponseText = execResult.getContent();

        // 7. Parse response
        String summaryText = "";
        String summaryBulletsJson = "";
        try {
            JsonObject jsonObj = gson.fromJson(rawResponseText, JsonObject.class);
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
            summaryText = rawResponseText;
            summaryBulletsJson = gson
                    .toJson(Arrays.asList("Tổng quan kiến thức cốt lõi.", "Chi tiết phương pháp và bài học."));
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
        List<Long> sortedIds = new ArrayList<>();
        if (documentIds != null) {
            for (Long id : documentIds) {
                if (id != null) {
                    sortedIds.add(id);
                }
            }
            Collections.sort(sortedIds);
        }

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
        if (documentIds != null) {
            for (int i = 0; i < documentIds.size(); i++) {
                Long docId = documentIds.get(i);
                if (docId == null) continue;
                Document doc = documentRepository.findById(docId).orElse(null);
                if (doc != null) {
                    docs.add(doc);
                    if (titleBuilder.length() > 0) {
                        titleBuilder.append(", ");
                    }
                    titleBuilder.append(doc.getTitle());
                }
            }
        }

        String title = titleBuilder.toString();
        if (title.length() > 255) {
            title = title.substring(0, 252) + "...";
        }
        if (title.isEmpty()) {
            title = "LumiEdu AI Assistant";
        }

        Long firstDocId = (documentIds != null && !documentIds.isEmpty()) ? documentIds.get(0) : null;

        AiChatSession session = AiChatSession.builder()
                .documentId(firstDocId)
                .userId(userId)
                .title(title)
                .documents(docs)
                .build();

        return aiChatSessionRepository.save(session);
    }

    @Override
    public List<AiChatSession> getUserSessions(Long userId) {
        return aiChatSessionRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    @Override
    public List<AiChatMessage> getChatHistory(Long sessionId) {
        return aiChatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    @Override
    public AiChatMessage sendMessage(Long sessionId, String messageText, boolean thinkingMode) {
        AiChatSession session = aiChatSessionRepository.findById(sessionId)
                .orElseThrow(() -> AiApiException.notFound("AI_SESSION_NOT_FOUND", "Chat session not found."));

        Long currentUserId = aiDocumentAccessService.getCurrentUserId();
        if (session.getUserId() != null && !session.getUserId().equals(currentUserId)) {
            aiDocumentAccessService.verifyUserAccess(session.getUserId());
        }

        // 1. Check billing limit
        if (aiLimitService != null && !aiLimitService.isWithinDailyLimit(currentUserId, "CHAT")) {
            throw AiApiException.rateLimited("Bạn đã vượt quá hạn mức sử dụng AI Chat hàng ngày của gói dịch vụ hiện tại.");
        }

        // Save User Message
        AiChatMessage userMessage = AiChatMessage.builder()
                .sessionId(sessionId)
                .sender("USER")
                .messageText(messageText)
                .build();
        aiChatMessageRepository.save(userMessage);

        // 2. Gather authorized documents attached to session
        List<Document> docObjects = new ArrayList<>();
        if (session.getDocuments() != null && !session.getDocuments().isEmpty()) {
            docObjects.addAll(session.getDocuments());
        } else if (session.getDocumentId() != null) {
            Document doc = documentRepository.findById(session.getDocumentId()).orElse(null);
            if (doc != null) {
                docObjects.add(doc);
            }
        }

        List<Long> authorizedDocIds = new ArrayList<>();
        StringBuilder docMetaContext = new StringBuilder();

        for (Document doc : docObjects) {
            try {
                Document validDoc = aiDocumentAccessService.validateAndGetDocument(doc.getId());
                authorizedDocIds.add(validDoc.getId());
                docMetaContext.append("Tài liệu: ").append(validDoc.getTitle());
                if (validDoc.getSubject() != null) docMetaContext.append(" | Môn học: ").append(validDoc.getSubject());
                if (validDoc.getDescription() != null && !validDoc.getDescription().isEmpty()) {
                    docMetaContext.append("\nMô tả: ").append(validDoc.getDescription());
                }
                docMetaContext.append("\n");

                // Auto-index chunks if not yet indexed
                List<DocumentChunk> existingChunks = documentChunkRepository.findByDocumentId(validDoc.getId());
                if (existingChunks.isEmpty()) {
                    try {
                        documentChunkingService.chunkAndIndexDocument(validDoc.getId());
                    } catch (Exception e) {
                        System.err.println("Failed to auto-index chunks for doc " + validDoc.getId() + ": " + e.getMessage());
                    }
                }
            } catch (Exception e) {
                // Ignore document if un-authorized or deleted
            }
        }

        RagSearchResult ragResult = new RagSearchResult("", Collections.emptyList());
        if (!authorizedDocIds.isEmpty()) {
            ragResult = performRagSearch(authorizedDocIds, messageText);
        }

        String aiResponseContent;
        List<ChatSourceDto> sources = ragResult.getSources();
        Long execLogId = null;

        // If session has authorized documents attached, but RAG returned no matching chunks/context
        if (!authorizedDocIds.isEmpty() && (ragResult.getContextText() == null || ragResult.getContextText().trim().isEmpty())) {
            aiResponseContent = "Không tìm thấy thông tin phù hợp trong các tài liệu được đính kèm để trả lời câu hỏi của bạn. Vui lòng thử diễn đạt lại câu hỏi hoặc cung cấp thêm thông tin.";
            sources = Collections.emptyList();
        } else {
            StringBuilder fullContextBuilder = new StringBuilder();
            if (!docMetaContext.isEmpty()) {
                fullContextBuilder.append("Attached Documents Metadata:\n").append(docMetaContext).append("\n\n");
            }
            if (!ragResult.getContextText().isEmpty()) {
                fullContextBuilder.append(ragResult.getContextText());
            }

            Map<String, Object> promptVars = new HashMap<>();
            promptVars.put("context", fullContextBuilder.toString().isEmpty() ? "No additional document context available." : fullContextBuilder.toString());
            promptVars.put("question", messageText);

            com.lumiedu.user.entity.User currentUser = userRepository.findById(session.getUserId()).orElse(null);

            com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                    "CHAT_QA",
                    promptVars,
                    currentUser,
                    currentUser != null ? currentUser.getEmail() : null,
                    "CHAT_QA",
                    String.valueOf(session.getId()),
                    "session-v" + session.getId(),
                    false
            );

            aiResponseContent = execResult.getContent();
            execLogId = execResult.getLogId();
        }

        // Save and return AI Message with structured sources
        AiChatMessage aiMessage = AiChatMessage.builder()
                .sessionId(sessionId)
                .sender("AI")
                .messageText(aiResponseContent)
                .executionLogId(execLogId)
                .sources(sources)
                .build();

        AiChatMessage savedMessage = aiChatMessageRepository.save(aiMessage);
        savedMessage.setSources(sources);
        return savedMessage;
    }

    @Override
    public List<Flashcard> generateFlashcards(Long documentId) {
        flashcardRepository.deleteByDocumentId(documentId);

        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) {
            throw new IllegalArgumentException("Document not found.");
        }

        List<DocumentChunk> chunks = getOrWaitForChunks(documentId);
        if (chunks.isEmpty()) {
            throw new IllegalStateException("Tài liệu đang được phân tích hoặc không chứa nội dung văn bản. Vui lòng thử lại sau.");
        }

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(chunks.size(), 3); i++) {
            sb.append(chunks.get(i).getContent()).append("\n");
        }
        String context = sb.toString();

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("count", 5);
        promptVars.put("language", "vi");
        promptVars.put("content", context);

        Long userId = doc.getUserId() != null ? doc.getUserId() : 1L;
        com.lumiedu.user.entity.User currentUser = userRepository.findById(userId).orElse(null);

        com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "FLASHCARD_GENERATION",
                promptVars,
                currentUser,
                currentUser != null ? currentUser.getEmail() : null,
                "FLASHCARD_GENERATION",
                String.valueOf(documentId),
                "doc-v" + documentId,
                true
        );

        String rawResponseText = execResult.getContent();

        List<Flashcard> list = new ArrayList<>();
        try {
            JsonArray arr = null;
            try {
                JsonObject jsonObj = gson.fromJson(rawResponseText, JsonObject.class);
                if (jsonObj.has("flashcards")) {
                    arr = jsonObj.getAsJsonArray("flashcards");
                }
            } catch (Exception e) {
                // If direct array
                arr = gson.fromJson(rawResponseText, JsonArray.class);
            }

            if (arr != null) {
                for (int i = 0; i < arr.size(); i++) {
                    JsonObject item = arr.get(i).getAsJsonObject();
                    list.add(Flashcard.builder()
                            .documentId(documentId)
                            .question(item.get("front").getAsString())
                            .answer(item.get("back").getAsString())
                            .build());
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to parse flashcards JSON response: " + e.getMessage());
            list.add(new Flashcard(null, documentId, "Mẫu thiết kế Singleton dùng để làm gì?",
                    "Đảm bảo một lớp chỉ có duy nhất một thực thể."));
            list.add(new Flashcard(null, documentId, "Mẫu thiết kế Observer hoạt động theo cơ chế nào?",
                    "Mối quan hệ phụ thuộc một-nhiều giữa các đối tượng."));
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

        List<DocumentChunk> chunks = getOrWaitForChunks(documentId);
        if (chunks.isEmpty()) {
            throw new IllegalStateException("Tài liệu đang được phân tích hoặc không chứa nội dung văn bản. Vui lòng thử lại sau.");
        }

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(chunks.size(), 4); i++) {
            sb.append(chunks.get(i).getContent()).append("\n");
        }
        String context = sb.toString();

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("count", count);
        promptVars.put("difficulty", difficulty != null ? difficulty : "Medium");
        promptVars.put("language", "vi");
        promptVars.put("content", context);

        com.lumiedu.user.entity.User currentUser = userRepository.findById(userId).orElse(null);

        com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "QUIZ_GENERATION",
                promptVars,
                currentUser,
                currentUser != null ? currentUser.getEmail() : null,
                "QUIZ_GENERATION",
                String.valueOf(documentId),
                "doc-v" + documentId,
                true
        );

        String rawResponseText = execResult.getContent();

        Quiz quiz = Quiz.builder()
                .documentId(documentId)
                .title("Quiz for " + doc.getTitle())
                .promptUsed(customPrompt)
                .build();
        quiz = quizRepository.save(quiz);

        List<QuizQuestion> questions = new ArrayList<>();
        try {
            JsonObject jsonObj = gson.fromJson(rawResponseText, JsonObject.class);
            JsonArray arr = jsonObj.getAsJsonArray("questions");
            for (int i = 0; i < arr.size(); i++) {
                JsonObject item = arr.get(i).getAsJsonObject();
                JsonArray optsArr = item.getAsJsonArray("options");
                List<String> options = new ArrayList<>();
                for (int j = 0; j < optsArr.size(); j++) {
                    options.add(optsArr.get(j).getAsString());
                }

                String qText = item.has("questionText") ? item.get("questionText").getAsString()
                        : (item.has("question") ? item.get("question").getAsString() : item.get("q").getAsString());

                int ansIdx = 0;
                if (item.has("answerIndex")) {
                    ansIdx = item.get("answerIndex").getAsInt();
                } else if (item.has("answer")) {
                    try {
                        ansIdx = item.get("answer").getAsInt();
                    } catch (Exception ex) {
                        String ansStr = item.get("answer").getAsString();
                        ansIdx = Math.max(0, options.indexOf(ansStr));
                    }
                } else if (item.has("correctAnswer")) {
                    String ansStr = item.get("correctAnswer").getAsString();
                    ansIdx = Math.max(0, options.indexOf(ansStr));
                }

                String explainText = item.has("explanation") ? item.get("explanation").getAsString()
                        : (item.has("explain") ? item.get("explain").getAsString() : "No explanation provided.");

                questions.add(QuizQuestion.builder()
                        .quiz(quiz)
                        .questionText(qText)
                        .options(gson.toJson(options))
                        .answerIndex(ansIdx)
                        .explanation(explainText)
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
        return getQuizResponse(documentId, null);
    }

    @Override
    public QuizResponse getQuizResponse(Long documentId, Long userId) {
        if (userId != null) {
            boolean hasAttempted = quizAttemptRepository.existsByUserIdAndDocumentId(userId, documentId);
            if (hasAttempted) {
                generateQuiz(documentId, "medium", 5, "Generate fresh new questions for user re-attempt");
            }
        }

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
                optionsList = gson.fromJson(qq.getOptions(), new com.google.gson.reflect.TypeToken<List<String>>() {
                }.getType());
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
    public StudyPlan generateStudyPlan(Long userId, String subject, String goal, int durationWeeks,
            List<Long> documentIds) {
        StringBuilder docContextBuilder = new StringBuilder();
        Set<Document> sourceDocs = new HashSet<>();

        if (documentIds != null && !documentIds.isEmpty()) {
            for (Long documentId : documentIds) {
                if (documentId == null)
                    continue;
                Document doc = documentRepository.findById(documentId).orElse(null);
                if (doc != null) {
                    sourceDocs.add(doc);
                    List<DocumentChunk> chunks = getOrWaitForChunks(documentId);
                    if (chunks.isEmpty()) {
                        docContextBuilder.append("[").append(doc.getTitle()).append("]: (Tài liệu đang được phân tích)\n");
                        continue;
                    }
                    for (int i = 0; i < Math.min(chunks.size(), 2); i++) {
                        docContextBuilder.append("[").append(doc.getTitle()).append("]: ")
                                .append(chunks.get(i).getContent()).append("\n");
                    }
                }
            }
        }
        String docContext = docContextBuilder.toString();

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("subject", subject);
        promptVars.put("durationWeeks", durationWeeks);
        promptVars.put("goal", goal != null ? goal : "Comprehensive Mastery");
        promptVars.put("dailyHours", 2);
        promptVars.put("context", docContext.isEmpty() ? "No additional reference materials uploaded." : docContext);

        com.lumiedu.user.entity.User currentUser = userRepository.findById(userId).orElse(null);

        com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "STUDY_PLAN",
                promptVars,
                currentUser,
                currentUser != null ? currentUser.getEmail() : null,
                "STUDY_PLAN",
                documentIds != null ? documentIds.toString() : "0",
                "docs-v1",
                true
        );

        String rawResponseText = execResult.getContent();

        String title = "Kế hoạch học tập " + subject;
        String planText = rawResponseText;
        String curriculumJson = "";

        try {
            JsonObject jsonObj = gson.fromJson(rawResponseText, JsonObject.class);
            title = jsonObj.get("title").getAsString();
            planText = jsonObj.get("planText").getAsString();
            JsonObject wrapper = new JsonObject();
            if (jsonObj.has("curriculum")) {
                wrapper.add("modules", jsonObj.get("curriculum"));
            }
            if (jsonObj.has("difficulty")) {
                wrapper.addProperty("difficulty", jsonObj.get("difficulty").getAsString());
            } else {
                wrapper.addProperty("difficulty", "Medium");
            }
            if (jsonObj.has("hoursEst")) {
                wrapper.addProperty("hoursEst", jsonObj.get("hoursEst").getAsNumber());
            } else {
                wrapper.addProperty("hoursEst", 28);
            }
            curriculumJson = gson.toJson(wrapper);
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
    public List<String> getCompletedLessons(Long planId) {
        StudyPlan plan = studyPlanRepository.findById(planId).orElse(null);
        if (plan == null || plan.getCompletedLessonsJson() == null || plan.getCompletedLessonsJson().isBlank()) {
            return new ArrayList<>();
        }
        try {
            com.google.gson.reflect.TypeToken<List<String>> typeToken = new com.google.gson.reflect.TypeToken<>() {};
            return gson.fromJson(plan.getCompletedLessonsJson(), typeToken.getType());
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    @Override
    public List<String> updateCompletedLessons(Long planId, List<String> lessonIds) {
        StudyPlan plan = studyPlanRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Study plan not found: " + planId));
        plan.setCompletedLessonsJson(gson.toJson(lessonIds));
        studyPlanRepository.save(plan);
        return lessonIds;
    }

    @Override
    public StudyPlan saveStudyPlan(StudyPlan studyPlan) {
        if (studyPlan.getPlanText() == null || studyPlan.getPlanText().trim().isEmpty()) {
            studyPlan.setPlanText("Lộ trình học tập cá nhân");
        }
        if (studyPlan.getSubject() == null || studyPlan.getSubject().trim().isEmpty()) {
            studyPlan.setSubject("General");
        }
        if (studyPlan.getUserId() == null) {
            studyPlan.setUserId(1L);
        }
        return studyPlanRepository.save(studyPlan);
    }

    @Override
    public StudyPlan updateStudyPlan(Long id, StudyPlan studyPlan) {
        StudyPlan existing = studyPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Study plan not found: " + id));
        existing.setTitle(studyPlan.getTitle());
        existing.setSubject(studyPlan.getSubject());
        existing.setPlanText(studyPlan.getPlanText());
        if (studyPlan.getCurriculumJson() != null) {
            existing.setCurriculumJson(studyPlan.getCurriculumJson());
        }
        if (studyPlan.getCompletedLessonsJson() != null) {
            existing.setCompletedLessonsJson(studyPlan.getCompletedLessonsJson());
        }
        if (studyPlan.getDocumentId() != null) {
            existing.setDocumentId(studyPlan.getDocumentId());
        }
        return studyPlanRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteStudyPlan(Long id) {
        studyPlanRepository.findById(id).ifPresent(plan -> {
            if (plan.getSourceDocuments() != null) {
                plan.getSourceDocuments().clear();
                studyPlanRepository.saveAndFlush(plan);
            }
            studyPlanRepository.delete(plan);
        });
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

    private static class RagSearchResult {
        private final String contextText;
        private final List<ChatSourceDto> sources;

        public RagSearchResult(String contextText, List<ChatSourceDto> sources) {
            this.contextText = contextText;
            this.sources = sources;
        }

        public String getContextText() { return contextText; }
        public List<ChatSourceDto> getSources() { return sources; }
    }

    private RagSearchResult performRagSearch(List<Long> documentIds, String query) {
        if (documentIds == null || documentIds.isEmpty()) {
            return new RagSearchResult("", Collections.emptyList());
        }
        
        List<DocumentChunk> chunks = new ArrayList<>();
        Map<Long, Document> docMap = new HashMap<>();

        for (Long documentId : documentIds) {
            if (documentId != null) {
                try {
                    Document doc = aiDocumentAccessService.validateAndGetDocument(documentId);
                    if (doc != null && !Boolean.TRUE.equals(doc.getDeleted())) {
                        docMap.put(doc.getId(), doc);
                        chunks.addAll(documentChunkRepository.findByDocumentId(doc.getId()));
                    }
                } catch (Exception e) {
                    // Exclude unauthorized documents
                }
            }
        }

        if (chunks.isEmpty()) {
            return new RagSearchResult("", Collections.emptyList());
        }

        float[] queryVector = null;
        try {
            queryVector = geminiService.getEmbedding(query);
        } catch (Exception e) {
            System.err.println("Failed to get query embedding: " + e.getMessage());
        }

        class ChunkVectorScore implements Comparable<ChunkVectorScore> {
            DocumentChunk chunk;
            double similarity;
            
            ChunkVectorScore(DocumentChunk chunk, double similarity) {
                this.chunk = chunk;
                this.similarity = similarity;
            }
            
            @Override
            public int compareTo(ChunkVectorScore o) {
                return Double.compare(o.similarity, this.similarity); // descending
            }
        }
        
        List<ChunkVectorScore> scoredChunks = new ArrayList<>();
        if (queryVector != null && queryVector.length > 0) {
            for (DocumentChunk chunk : chunks) {
                if (chunk.getEmbedding() != null && !chunk.getEmbedding().isEmpty()) {
                    try {
                        float[] chunkVector = gson.fromJson(chunk.getEmbedding(), float[].class);
                        double similarity = cosineSimilarity(queryVector, chunkVector);
                        // Reject dimension mismatch (-1.0) and below threshold (0.25)
                        if (similarity >= 0.25) {
                            scoredChunks.add(new ChunkVectorScore(chunk, similarity));
                        }
                    } catch (Exception e) {
                        System.err.println("Failed to parse or compute similarity for chunk ID " + chunk.getId() + ": " + e.getMessage());
                    }
                }
            }
        }
        
        List<DocumentChunk> candidateChunks = new ArrayList<>();
        if (!scoredChunks.isEmpty()) {
            Collections.sort(scoredChunks);
            for (ChunkVectorScore cs : scoredChunks) {
                candidateChunks.add(cs.chunk);
            }
        } else {
            candidateChunks = performKeywordSearchChunks(chunks, query);
        }

        if (candidateChunks.isEmpty()) {
            return new RagSearchResult("", Collections.emptyList());
        }
        
        StringBuilder result = new StringBuilder();
        result.append("<document_context>\n");
        Set<String> seenSnippets = new HashSet<>();
        List<ChatSourceDto> sources = new ArrayList<>();
        int count = 0;
        int currentCharacterCount = 0;
        final int MAX_CHAR_BUDGET = 6000;

        for (DocumentChunk c : candidateChunks) {
            if (count >= 5 || currentCharacterCount >= MAX_CHAR_BUDGET) break;
            String snippet = c.getContent() != null ? c.getContent().trim() : "";
            String normalizedSnippet = snippet.toLowerCase().replaceAll("\\s+", " ");

            if (!snippet.isEmpty() && seenSnippets.add(normalizedSnippet)) {
                Document doc = docMap.get(c.getDocumentId());
                if (doc == null) {
                    doc = documentRepository.findById(c.getDocumentId()).orElse(null);
                }
                String docTitle = doc != null ? doc.getTitle() : ("Document " + c.getDocumentId());

                String sanitizedContent = sanitizeChunkContent(snippet);
                String chunkBlock = String.format("  <source id=\"%d\" title=\"%s\" chunk=\"%d\">\n    %s\n  </source>\n",
                        c.getDocumentId(), sanitizeAttribute(docTitle), c.getChunkIndex() != null ? c.getChunkIndex() : 0, sanitizedContent);

                if (currentCharacterCount + chunkBlock.length() > MAX_CHAR_BUDGET && count > 0) {
                    break;
                }

                result.append(chunkBlock);
                currentCharacterCount += chunkBlock.length();
                count++;

                String excerpt = snippet.length() > 150 ? snippet.substring(0, 150) + "..." : snippet;
                sources.add(ChatSourceDto.builder()
                        .documentId(c.getDocumentId())
                        .documentTitle(docTitle)
                        .chunkId(c.getId())
                        .chunkIndex(c.getChunkIndex())
                        .excerpt(excerpt)
                        .build());
            }
        }
        result.append("</document_context>");
        
        return new RagSearchResult(result.toString(), sources);
    }

    private String sanitizeChunkContent(String text) {
        if (text == null) return "";
        String cleaned = text.replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]", "");
        return cleaned.replace("<document_context>", "&lt;document_context&gt;")
                      .replace("</document_context>", "&lt;/document_context&gt;")
                      .replace("</source>", "&lt;/source&gt;");
    }

    private String sanitizeAttribute(String attr) {
        if (attr == null) return "";
        return attr.replace("\"", "&quot;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private double cosineSimilarity(float[] vectorA, float[] vectorB) {
        if (vectorA == null || vectorB == null) return 0.0;
        if (vectorA.length != vectorB.length) {
            System.err.println("Vector dimension mismatch: vectorA=" + vectorA.length + " vs vectorB=" + vectorB.length + ". Vector comparison rejected.");
            return -1.0;
        }
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += Math.pow(vectorA[i], 2);
            normB += Math.pow(vectorB[i], 2);
        }
        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private List<DocumentChunk> performKeywordSearchChunks(List<DocumentChunk> chunks, String query) {
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
            String contentLower = chunk.getContent() != null ? chunk.getContent().toLowerCase() : "";
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
            return Collections.emptyList();
        }
        
        Collections.sort(scoredChunks);
        List<DocumentChunk> result = new ArrayList<>();
        for (ChunkScore cs : scoredChunks) {
            result.add(cs.chunk);
        }
        return result;
    }

    private List<DocumentChunk> getOrWaitForChunks(Long documentId) {
        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(documentId);
        if (chunks.isEmpty()) {
            if (!documentChunkingService.isProcessing(documentId)) {
                documentChunkingService.chunkAndIndexDocument(documentId);
            }
            // Polling wait for async task to complete
            for (int i = 0; i < 15; i++) {
                try {
                    Thread.sleep(1000L);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                chunks = documentChunkRepository.findByDocumentId(documentId);
                if (!chunks.isEmpty()) {
                    break;
                }
            }
        }
        return chunks;
    }
}
// Force JDT LS revalidation 2
