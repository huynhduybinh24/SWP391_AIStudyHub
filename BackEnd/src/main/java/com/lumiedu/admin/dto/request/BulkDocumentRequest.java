package com.lumiedu.admin.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class BulkDocumentRequest {
    private List<Long> ids;
    private String reason;

    public List<Long> getIds() { return ids; }
    public void setIds(List<Long> ids) { this.ids = ids; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
