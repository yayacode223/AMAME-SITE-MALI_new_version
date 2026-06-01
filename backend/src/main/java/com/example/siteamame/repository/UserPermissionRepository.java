package com.example.siteamame.repository;

import com.example.siteamame.enumeration.Permission;
import com.example.siteamame.model.User;
import com.example.siteamame.model.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPermissionRepository extends JpaRepository<UserPermission, Long> {

    List<UserPermission> findByUser(User user);

    Optional<UserPermission> findByUserAndPermission(User user, Permission permission);

    @Modifying
    void deleteByUserAndPermission(User user, Permission permission);

    @Modifying
    void deleteByUser(User user);
}
