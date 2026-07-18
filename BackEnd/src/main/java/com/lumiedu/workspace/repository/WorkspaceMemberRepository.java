package com.lumiedu.workspace.repository;

import com.lumiedu.workspace.entity.WorkspaceMember;
import com.lumiedu.workspace.enums.WorkspaceMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Long> {

    List<WorkspaceMember> findByWorkspaceId(Long workspaceId);

    Optional<WorkspaceMember> findByWorkspaceIdAndUserId(Long workspaceId, Long userId);

    Optional<WorkspaceMember> findByWorkspaceIdAndEmail(Long workspaceId, String email);

    List<WorkspaceMember> findByEmailAndStatus(String email, WorkspaceMemberStatus status);

    List<WorkspaceMember> findByUserIdAndStatus(Long userId, WorkspaceMemberStatus status);
}
