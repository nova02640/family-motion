package com.familymotion.app.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Speed
import androidx.compose.ui.graphics.vector.ImageVector

/**
 * 导航路由定义
 */
sealed class Screen(val route: String) {
    object Home : Screen("home")
    object Exercise : Screen("exercise/{planId}") {
        fun createRoute(planId: String) = "exercise/$planId"
    }
    object ExerciseCamera : Screen("exercise_camera/{planId}/{exerciseIndex}") {
        fun createRoute(planId: String, exerciseIndex: Int) = "exercise_camera/$planId/$exerciseIndex"
    }
    object ExerciseResult : Screen("exercise_result")
    object Assessment : Screen("assessment")
    object AssessmentResult : Screen("assessment_result")
    object Profile : Screen("profile")
    object ParentControl : Screen("parent_control")
    object Settings : Screen("settings")
}

/**
 * 底部导航项
 */
sealed class BottomNavItem(
    val route: String,
    val title: String,
    val icon: ImageVector
) {
    object Home : BottomNavItem(
        route = Screen.Home.route,
        title = "首页",
        icon = Icons.Default.Home
    )

    object Exercise : BottomNavItem(
        route = "exercise_tab",
        title = "运动",
        icon = Icons.Default.FitnessCenter
    )

    object Assessment : BottomNavItem(
        route = Screen.Assessment.route,
        title = "测评",
        icon = Icons.Default.Speed
    )

    object Profile : BottomNavItem(
        route = Screen.Profile.route,
        title = "我的",
        icon = Icons.Default.Person
    )
}

val bottomNavItems = listOf(
    BottomNavItem.Home,
    BottomNavItem.Exercise,
    BottomNavItem.Assessment,
    BottomNavItem.Profile
)
