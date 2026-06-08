package com.lumiedu.workspace.repository;

import com.lumiedu.workspace.entity.SharedWorkspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SharedWorkspaceRepository extends JpaRepository<SharedWorkspace, Long> {

    List<SharedWorkspace> findByOwnerId(Long ownerId);

    @Query("SELECT sw FROM SharedWorkspace sw WHERE sw.ownerId = :userId OR sw.id IN (SELECT wm.workspaceId FROM WorkspaceMember wm WHERE wm.userId = :userId AND wm.status = 'ACCEPTED')")
    List<SharedWorkspace> findAllByMemberUserId(@Param("userId") Long userId);
}
