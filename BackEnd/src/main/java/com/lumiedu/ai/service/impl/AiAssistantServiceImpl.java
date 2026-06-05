package com.lumiedu.ai.service.impl;

import com.google.gson.Gson;
import com.lumiedu.ai.entity.*;
import com.lumiedu.ai.repository.*;
import com.lumiedu.ai.service.AiAssistantService;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class AiAssistantServiceImpl implements AiAssistantService {

    private final AiSummaryRepository aiSummaryRepository;
    private final AiChatSessionRepository aiChatSessionRepository;
    private final AiChatMessageRepository aiChatMessageRepository;
    private final FlashcardRepository flashcardRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final DocumentRepository documentRepository;
    private final Gson gson = new Gson();

    @Override
    public AiSummary generateSummary(Long documentId) {
        Optional<AiSummary> existing = aiSummaryRepository.findByDocumentId(documentId);
        if (existing.isPresent()) {
            return existing.get();
        }

        Document doc = documentRepository.findById(documentId).orElse(null);
        String subject = (doc != null && doc.getSubject() != null) ? doc.getSubject() : "GENERAL";
        String title = doc != null ? doc.getTitle() : "Tài liệu học tập";

        String summaryText = "Tài liệu này chứa nội dung quan trọng về " + subject + " liên quan đến " + title + ". "
                + "Tài liệu cung cấp các định nghĩa nền tảng, công thức then chốt, và phương pháp ứng dụng thực tiễn của chủ đề học tập này.";

        List<String> bullets = getSampleBullets(subject);
        String bulletsJson = gson.toJson(bullets);

        AiSummary summary = AiSummary.builder()
                .documentId(documentId)
                .summaryText(summaryText)
                .summaryBullets(bulletsJson)
                .build();

        return aiSummaryRepository.save(summary);
    }

    @Override
    public AiSummary getSummary(Long documentId) {
        return aiSummaryRepository.findByDocumentId(documentId)
                .orElseGet(() -> generateSummary(documentId));
    }

    @Override
    public AiChatSession createOrGetChatSession(Long documentId, Long userId) {
        return aiChatSessionRepository.findByDocumentIdAndUserId(documentId, userId)
                .orElseGet(() -> {
                    AiChatSession session = AiChatSession.builder()
                            .documentId(documentId)
                            .userId(userId)
                            .build();
                    return aiChatSessionRepository.save(session);
                });
    }

    @Override
    public List<AiChatMessage> getChatHistory(Long sessionId) {
        return aiChatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    @Override
    public AiChatMessage sendMessage(Long sessionId, String messageText) {
        // Save user message
        AiChatMessage userMessage = AiChatMessage.builder()
                .sessionId(sessionId)
                .sender("USER")
                .messageText(messageText)
                .build();
        aiChatMessageRepository.save(userMessage);

        // Retrieve session
        AiChatSession session = aiChatSessionRepository.findById(sessionId).orElse(null);
        String subject = "GENERAL";
        String docName = "tài liệu";
        if (session != null && session.getDocumentId() != null) {
            Document doc = documentRepository.findById(session.getDocumentId()).orElse(null);
            if (doc != null) {
                subject = doc.getSubject() != null ? doc.getSubject() : "GENERAL";
                docName = doc.getTitle();
            }
        }

        // Generate simulated AI reply
        String replyText = generateAiReply(messageText, docName, subject);

        // Save AI message
        AiChatMessage aiMessage = AiChatMessage.builder()
                .sessionId(sessionId)
                .sender("AI")
                .messageText(replyText)
                .build();
        return aiChatMessageRepository.save(aiMessage);
    }

    @Override
    public List<Flashcard> generateFlashcards(Long documentId) {
        flashcardRepository.deleteByDocumentId(documentId);

        Document doc = documentRepository.findById(documentId).orElse(null);
        String subject = (doc != null && doc.getSubject() != null) ? doc.getSubject() : "GENERAL";

        List<Flashcard> cards = getSampleFlashcards(documentId, subject);
        return flashcardRepository.saveAll(cards);
    }

    @Override
    public List<QuizQuestion> generateQuiz(Long documentId, String difficulty, int count, String customPrompt) {
        quizQuestionRepository.deleteByDocumentId(documentId);

        Document doc = documentRepository.findById(documentId).orElse(null);
        String subject = (doc != null && doc.getSubject() != null) ? doc.getSubject() : "GENERAL";

        List<QuizQuestion> questions = getSampleQuizQuestions(documentId, subject, difficulty, customPrompt);

        // Trim or pad to match count
        if (questions.size() > count) {
            questions = new ArrayList<>(questions.subList(0, count));
        } else if (questions.size() < count) {
            int currentSize = questions.size();
            for (int i = 0; i < count - currentSize; i++) {
                questions.add(QuizQuestion.builder()
                        .documentId(documentId)
                        .q("Câu hỏi trắc nghiệm bổ sung " + (i + 1) + " về " + subject)
                        .options(gson.toJson(Arrays.asList("Đáp án A", "Đáp án B (Đúng)", "Đáp án C", "Đáp án D")))
                        .answer(1)
                        .explain("Đây là câu trả lời bổ sung của AI dựa trên tài liệu.")
                        .build());
            }
        }

        return quizQuestionRepository.saveAll(questions);
    }

    @Override
    public List<QuizQuestion> modifyQuizWithAi(Long documentId, String prompt) {
        List<QuizQuestion> existing = quizQuestionRepository.findByDocumentId(documentId);
        if (existing.isEmpty()) {
            existing = generateQuiz(documentId, "medium", 10, "");
        }

        String lowerPrompt = prompt.toLowerCase();
        List<QuizQuestion> modified = new ArrayList<>();

        for (int i = 0; i < existing.size(); i++) {
            QuizQuestion q = existing.get(i);
            List<String> currentOpts = gson.fromJson(q.getOptions(), List.class);
            List<String> newOpts = new ArrayList<>();
            String newQ = q.getQ();
            String newExplain = q.getExplain();

            if (lowerPrompt.contains("tiếng anh") || lowerPrompt.contains("english")) {
                newQ = "[Translated] Question " + (i + 1) + ": " + translateToEnglish(q.getQ());
                for (String opt : currentOpts) {
                    newOpts.add(translateToEnglish(opt));
                }
                newExplain = "AI Explanation: The correct answer is option " + (char)('A' + q.getAnswer()) + ". Fully updated via prompt translation.";
            } else if (lowerPrompt.contains("khó") || lowerPrompt.contains("hard") || lowerPrompt.contains("nâng cao")) {
                newQ = "[NÂNG CAO] " + q.getQ().replace("[CƠ BẢN] ", "").replace("[AI Đã Tinh Chỉnh] ", "");
                newOpts = currentOpts;
                newExplain = "Giải thích nâng cao: " + q.getExplain() + " Hãy chú ý liên kết giữa các biến số và cơ chế vận hành đa chiều.";
            } else if (lowerPrompt.contains("dễ") || lowerPrompt.contains("easy") || lowerPrompt.contains("cơ bản")) {
                newQ = "[CƠ BẢN] " + q.getQ().replace("[NÂNG CAO] ", "").replace("[AI Đã Tinh Chỉnh] ", "");
                newOpts = currentOpts;
                newExplain = "Giải thích cơ bản: " + q.getExplain();
            } else {
                newQ = "[AI Đã Tinh Chỉnh] " + q.getQ();
                newOpts = currentOpts;
                newExplain = "[AI cập nhật giải thích]: " + q.getExplain();
            }

            modified.add(QuizQuestion.builder()
                    .documentId(documentId)
                    .q(newQ)
                    .options(gson.toJson(newOpts))
                    .answer(q.getAnswer())
                    .explain(newExplain)
                    .build());
        }

        quizQuestionRepository.deleteByDocumentId(documentId);
        return quizQuestionRepository.saveAll(modified);
    }

    @Override
    public List<QuizQuestion> getQuiz(Long documentId) {
        List<QuizQuestion> questions = quizQuestionRepository.findByDocumentId(documentId);
        if (questions.isEmpty()) {
            return generateQuiz(documentId, "medium", 10, "");
        }
        return questions;
    }

    // --- Helper Methods ---

    private List<String> getSampleBullets(String subject) {
        switch (subject.toUpperCase()) {
            case "COMPSCI":
                return Arrays.asList(
                        "Tổng quan về 3 nhóm mẫu thiết kế chính: Khởi tạo, Cấu trúc, và Hành vi.",
                        "Cách viết mẫu thiết kế Singleton Thread-safe trong môi trường đa luồng.",
                        "Hướng dẫn áp dụng mẫu thiết kế Observer cho lập trình hướng sự kiện.",
                        "So sánh chi tiết mẫu Strategy và mẫu Decorator."
                );
            case "MATHEMATICS":
                return Arrays.asList(
                        "Bảng công thức đạo hàm và tích phân hàm lượng giác cơ bản.",
                        "Định nghĩa tích phân phân kỳ và chuỗi số vô hạn.",
                        "Khai triển chuỗi Taylor và chuỗi Maclaurin của các hàm phổ biến.",
                        "Giới hạn đặc biệt phục vụ tính nhanh đạo hàm."
                );
            case "BIOLOGY":
                return Arrays.asList(
                        "Quy trình hô hấp tế bào và chức năng tổng hợp năng lượng ATP của Ty thể.",
                        "Các giai đoạn phiên mã và dịch mã tổng hợp protein ở sinh vật nhân thực.",
                        "Quy luật di truyền của Mendel và tỉ lệ kiểu hình kiểu gen cơ bản.",
                        "Bản đồ cấu trúc tế bào và chức năng bào quan."
                );
            case "PHYSICS":
                return Arrays.asList(
                        "Lưỡng tính sóng hạt của vật chất và hệ thức bước sóng De Broglie.",
                        "Phương trình sóng độc lập thời gian Schrödinger.",
                        "Hiện tượng đường hầm lượng tử và ứng dụng thực tế.",
                        "Định lượng hiện tượng quang điện ngoài của Einstein."
                );
            case "NEUROSCIENCE":
                return Arrays.asList(
                        "Cấu trúc vỏ não chia làm 4 thùy với các chức năng điều hành vận động.",
                        "Vị trí và nhiệm vụ chuyển đổi ký ức ngắn hạn thành dài hạn của Hồi hải mã.",
                        "Quy trình truyền dẫn hóa học qua khe synap dưới tác động của điện thế hoạt động.",
                        "Học thuyết điều khiển cảm xúc sợ hãi của Hạch hạnh nhân."
                );
            default:
                return Arrays.asList(
                        "Giới thiệu phương pháp ôn tập chủ động Active Recall giúp nhớ sâu.",
                        "Cách áp dụng lặp lại ngắt quãng Spaced Repetition dựa trên đường cong lãng quên.",
                        "Kỹ thuật Feynman giải thích bài học phức tạp bằng từ ngữ đơn giản.",
                        "Cơ chế thiết lập dàn bài học thuật chuẩn hóa cho nghiên cứu."
                );
        }
    }

    private List<Flashcard> getSampleFlashcards(Long documentId, String subject) {
        List<Flashcard> cards = new ArrayList<>();
        switch (subject.toUpperCase()) {
            case "COMPSCI":
                cards.add(new Flashcard(null, documentId, "Mẫu thiết kế Singleton dùng để làm gì?", "Đảm bảo một lớp chỉ có duy nhất một thực thể (instance) và cung cấp một điểm truy cập toàn cục cho thực thể đó."));
                cards.add(new Flashcard(null, documentId, "Mẫu thiết kế Observer hoạt động theo cơ chế nào?", "Định nghĩa mối quan hệ phụ thuộc một-nhiều giữa các đối tượng. Khi một đối tượng thay đổi trạng thái, tất cả các đối tượng phụ thuộc sẽ được tự động thông báo và cập nhật."));
                cards.add(new Flashcard(null, documentId, "Sự khác biệt giữa Factory Method và Abstract Factory là gì?", "Factory Method sử dụng tính kế thừa để quyết định đối tượng cụ thể nào được khởi tạo. Abstract Factory sử dụng ủy quyền (composition) để khởi tạo một họ các đối tượng liên quan."));
                break;
            case "MATHEMATICS":
                cards.add(new Flashcard(null, documentId, "Đạo hàm của sin(x) là gì?", "cos(x)"));
                cards.add(new Flashcard(null, documentId, "Đạo hàm của ln(x) là gì?", "1/x"));
                cards.add(new Flashcard(null, documentId, "Công thức Euler liên hệ các hằng số toán học quan trọng?", "e^(i*π) + 1 = 0"));
                break;
            case "BIOLOGY":
                cards.add(new Flashcard(null, documentId, "Ty thể đóng vai trò gì trong tế bào?", "Tổng hợp năng lượng ATP thông qua hô hấp tế bào."));
                cards.add(new Flashcard(null, documentId, "Phiên mã (Transcription) diễn ra ở đâu?", "Trong nhân tế bào (ở sinh vật nhân thực)."));
                cards.add(new Flashcard(null, documentId, "Bazơ nitơ nào thay thế Thymine trong phân tử RNA?", "Uracil (U)."));
                break;
            default:
                cards.add(new Flashcard(null, documentId, "Phương pháp Active Recall hoạt động như thế nào?", "Chủ động kiểm tra trí nhớ bằng cách tự hỏi và trả lời thay vì chỉ đọc lại bài học thụ động."));
                cards.add(new Flashcard(null, documentId, "Kỹ thuật Feynman là gì?", "Giải thích một khái niệm phức tạp bằng ngôn từ đơn giản nhất như thể đang giảng cho một đứa trẻ để phát hiện lỗ hổng kiến thức."));
                cards.add(new Flashcard(null, documentId, "Lặp lại ngắt quãng (Spaced Repetition) dựa trên hiện tượng nào?", "Đường cong quên lãng (Forgetting Curve) của Ebbinghaus."));
                break;
        }
        return cards;
    }

    private List<QuizQuestion> getSampleQuizQuestions(Long documentId, String subject, String difficulty, String prompt) {
        List<QuizQuestion> questions = new ArrayList<>();
        boolean isHard = difficulty.equalsIgnoreCase("hard") || prompt.toLowerCase().contains("hard") || prompt.toLowerCase().contains("khó");

        switch (subject.toUpperCase()) {
            case "COMPSCI":
                if (isHard) {
                    questions.add(new QuizQuestion(null, documentId, "[NÂNG CAO] Trong các phát biểu sau về Singleton Pattern, phát biểu nào phản ánh chính xác nhất cách hiện thực Thread-Safe tối ưu mà không gây ảnh hưởng lớn đến performance?",
                            gson.toJson(Arrays.asList("Sử dụng từ khóa synchronized trực tiếp trên phương thức getInstance()", "Sử dụng kỹ thuật Double-Checked Locking kết hợp từ khóa volatile cho biến instance", "Sử dụng Eager Initialization tại thời điểm load class", "Sử dụng Static Inner Helper Class (Bill Pugh Singleton)")),
                            3, "Mẫu thiết kế Bill Pugh Singleton dựa vào JVM Class Loader để đảm bảo thread-safe đồng thời trì hoãn việc khởi tạo mà không tốn chi phí đồng bộ hóa."));
                    questions.add(new QuizQuestion(null, documentId, "[NÂNG CAO] Khi kết hợp Observer Pattern với luồng xử lý bất đồng bộ (Reactive Programming), vấn đề nào cần được kiểm soát chặt chẽ nhất để tránh lỗi rò rỉ bộ nhớ (Memory Leak)?",
                            gson.toJson(Arrays.asList("Hiện tượng Backpressure khi nhà sản xuất gửi dữ liệu quá nhanh", "Hủy đăng ký (unsubscribe/dispose) các Observer sau khi kết thúc chu kỳ hoạt động", "Tránh việc chia sẻ trạng thái thay đổi đa luồng", "Sử dụng WeakReference cho các Subject")),
                            1, "Rò rỉ bộ nhớ xảy ra nếu Subject giữ tham chiếu mạnh đến Observer. Khi Observer không dùng nữa, bộ dọn rác GC không thể dọn nó vì tham chiếu từ Subject vẫn còn tồn tại."));
                } else {
                    questions.add(new QuizQuestion(null, documentId, "Mẫu thiết kế nào dưới đây thuộc nhóm Creational (Khởi tạo)?",
                            gson.toJson(Arrays.asList("Observer Pattern", "Singleton Pattern", "Adapter Pattern", "Strategy Pattern")),
                            1, "Singleton Pattern, Factory Method và Builder là các mẫu thuộc nhóm Creational giúp kiểm soát việc khởi tạo đối tượng."));
                    questions.add(new QuizQuestion(null, documentId, "Mẫu thiết kế nào cho phép các đối tượng không tương thích có thể làm việc cùng nhau bằng cách chuyển đổi giao diện của chúng?",
                            gson.toJson(Arrays.asList("Decorator Pattern", "Facade Pattern", "Adapter Pattern", "Proxy Pattern")),
                            2, "Adapter Pattern hoạt động giống như một phích cắm chuyển đổi giúp kết nối hai giao diện không tương thích."));
                    questions.add(new QuizQuestion(null, documentId, "Khi muốn định nghĩa một họ thuật toán và cho phép hoán đổi chúng linh hoạt tại thời điểm chạy (runtime), mẫu thiết kế nào được dùng?",
                            gson.toJson(Arrays.asList("Strategy Pattern", "Observer Pattern", "Command Pattern", "Template Method")),
                            0, "Strategy Pattern đóng gói từng thuật toán độc lập và cho phép client thay đổi thuật toán tại runtime tùy ngữ cảnh."));
                }
                break;
            case "PHYSICS":
                if (isHard) {
                    questions.add(new QuizQuestion(null, documentId, "[NÂNG CAO] Hệ thức bất định Heisenberg Δx.Δp >= h/4π phản ánh bản chất vật lý cốt lõi nào của thế giới lượng tử?",
                            gson.toJson(Arrays.asList("Sai số do dụng cụ đo lường và khả năng quan sát của con người", "Bản chất sóng-hạt vốn có của mọi hạt vật chất", "Tác động nhiệt động lực học phá hủy hàm sóng", "Lực ma sát lượng tử trong chân không")),
                            1, "Hệ thức bất định là tính chất cơ học lượng tử nội tại phát sinh từ bản chất sóng của vật chất, không phải do sai số của thiết bị đo."));
                } else {
                    questions.add(new QuizQuestion(null, documentId, "Hạt mang tính chất sóng của cơ học lượng tử giúp nó vượt qua rào cản thế năng cao hơn động năng gọi là gì?",
                            gson.toJson(Arrays.asList("Chồng chập lượng tử", "Vướng víu lượng tử", "Đường hầm lượng tử", "Dịch chuyển lượng tử")),
                            2, "Đường hầm lượng tử (Quantum Tunneling) cho phép hạt vượt rào cản nhờ đặc tính phân bố xác suất sóng."));
                    questions.add(new QuizQuestion(null, documentId, "Công thức bước sóng De Broglie liên hệ giữa λ, h và động lượng p là gì?",
                            gson.toJson(Arrays.asList("λ = h/p", "λ = hp", "λ = p/h", "λ = mc²")),
                            0, "Bước sóng De Broglie λ = h/p chứng minh bản chất lưỡng tính sóng-hạt của mọi vật thể chuyển động."));
                }
                break;
            default:
                questions.add(new QuizQuestion(null, documentId, "Phương pháp ôn tập nào giúp tăng hiệu quả ghi nhớ lâu bằng cách chủ động tự kiểm tra?",
                        gson.toJson(Arrays.asList("Đọc đi đọc lại tài liệu", "Active Recall (Chủ động gợi nhớ)", "Tô đậm từ khóa quan trọng", "Nghe nhạc khi học bài")),
                        1, "Active Recall kích hoạt các nơ-ron liên kết ký ức, giúp thông tin lưu trữ lâu hơn so với việc đọc thụ động."));
                questions.add(new QuizQuestion(null, documentId, "Cơ chế Spaced Repetition (Lặp lại ngắt quãng) khuyên người học ôn tập tại thời điểm nào?",
                        gson.toJson(Arrays.asList("Ngay trước khi kỳ thi diễn ra 1 tiếng", "Mỗi ngày lặp lại liên tục 10 lần", "Ngay tại thời điểm thông tin chuẩn bị bị quên lãng", "Học dồn vào cuối tuần")),
                        2, "Ôn tập ngay khi kiến thức sắp quên lãng theo đường cong lãng quên của Ebbinghaus giúp gia cố đường mòn thần kinh bền vững nhất."));
                break;
        }
        return questions;
    }

    private String translateToEnglish(String text) {
        if (text == null) return "";
        switch (text) {
            case "Mẫu thiết kế nào dưới đây thuộc nhóm Creational (Khởi tạo)?":
                return "Which of the following design patterns belongs to the Creational group?";
            case "Observer Pattern": return "Observer Pattern";
            case "Singleton Pattern": return "Singleton Pattern";
            case "Adapter Pattern": return "Adapter Pattern";
            case "Strategy Pattern": return "Strategy Pattern";
            case "Mẫu thiết kế nào cho phép các đối tượng không tương thích có thể làm việc cùng nhau bằng cách chuyển đổi giao diện của chúng?":
                return "Which design pattern allows incompatible interfaces to work together by converting their interfaces?";
            case "Decorator Pattern": return "Decorator Pattern";
            case "Facade Pattern": return "Facade Pattern";
            case "Proxy Pattern": return "Proxy Pattern";
            case "Khi muốn định nghĩa một họ thuật toán và cho phép hoán đổi chúng linh hoạt tại thời điểm chạy (runtime), mẫu thiết kế nào được dùng?":
                return "When you want to define a family of algorithms and make them interchangeable at runtime, which pattern is used?";
            case "Command Pattern": return "Command Pattern";
            case "Template Method": return "Template Method";
            case "Phương pháp ôn tập nào giúp tăng hiệu quả ghi nhớ lâu bằng cách chủ động tự kiểm tra?":
                return "Which study method enhances long-term memory through active self-testing?";
            case "Đọc đi đọc lại tài liệu": return "Rereading the material repeatedly";
            case "Active Recall (Chủ động gợi nhớ)": return "Active Recall";
            case "Tô đậm từ khóa quan trọng": return "Highlighting key words";
            case "Nghe nhạc khi học bài": return "Listening to music while studying";
            case "Cơ chế Spaced Repetition (Lặp lại ngắt quãng) khuyên người học ôn tập tại thời điểm nào?":
                return "At what time does the Spaced Repetition mechanism advise students to review?";
            case "Ngay trước khi kỳ thi diễn ra 1 tiếng": return "Just 1 hour before the exam starts";
            case "Mỗi ngày lặp lại liên tục 10 lần": return "Repeating continuously 10 times a day";
            case "Ngay tại thời điểm thông tin chuẩn bị bị quên lãng": return "Right at the moment when information is about to be forgotten";
            case "Học dồn vào cuối tuần": return "Cramming at the weekend";
            default:
                // Fallback translation rules
                if (text.startsWith("[NÂNG CAO]")) {
                    return "[ADVANCED] " + text.replace("[NÂNG CAO] ", "");
                }
                if (text.startsWith("[CƠ BẢN]")) {
                    return "[BASIC] " + text.replace("[CƠ BẢN] ", "");
                }
                return text;
        }
    }

    private String generateAiReply(String text, String docName, String subject) {
        String lower = text.toLowerCase();
        if (lower.contains("summary") || lower.contains("tóm tắt") || lower.contains("overview") || lower.contains("quá trình")) {
            return "Dưới đây là tóm tắt nhanh của tôi về tài liệu '" + docName + "' (" + subject + "):\n\n"
                    + "1. Tài liệu tập trung giải quyết các bài toán/khái niệm cơ bản của " + subject + ".\n"
                    + "2. Phân tích sâu các yếu tố cốt lõi giúp củng cố kiến thức ôn luyện.\n"
                    + "3. Đề xuất các phương pháp học tập kết hợp làm trắc nghiệm thực hành để ghi nhớ sâu sắc.\n\n"
                    + "Bạn có cần tôi giải thích chi tiết hơn về phần nào trong tài liệu này không?";
        }
        if (lower.contains("quiz") || lower.contains("test") || lower.contains("kiểm tra") || lower.contains("câu hỏi")) {
            return "Để kiểm tra mức độ hiểu tài liệu của bạn, dưới đây là một câu hỏi nhanh:\n\n"
                    + "Khái niệm/nguyên lý nào là trọng tâm nhất của môn học " + subject + " thảo luận trong tài liệu?\n\n"
                    + "A) Nguyên lý hoạt động cơ bản\n"
                    + "B) Phương pháp giải quy chuẩn nâng cao\n"
                    + "C) Mô hình kết nối thực tiễn\n"
                    + "D) Toàn bộ các phương án trên đều đúng\n\n"
                    + "Hãy chọn đáp án của bạn!";
        }
        return "Chào bạn! Tôi là Trợ lý học tập AI của LumiEdu. Tôi đã sẵn sàng hỗ trợ bạn ôn tập tài liệu '" + docName + "' thuộc môn học " + subject + ". Bạn có thể hỏi tôi bất kỳ câu hỏi nào về nội dung tài liệu hoặc yêu cầu tôi tạo Quiz, Flashcard ôn tập nhé!";
    }
}
