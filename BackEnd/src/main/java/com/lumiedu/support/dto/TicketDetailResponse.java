package com.lumiedu.support.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketDetailResponse {
    private SupportTicketResponse ticket;
    private List<SupportMessageResponse> messages;
}
