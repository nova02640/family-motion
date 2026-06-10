package com.familymotion.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.familymotion.app.data.model.AssessmentResult
import com.familymotion.app.data.model.ExercisePlan
import com.familymotion.app.data.repository.SceneModeRepository
import com.familymotion.app.ui.navigation.Screen
import com.familymotion.app.ui.navigation.bottomNavItems
import com.familymotion.app.ui.screens.*
import com.familymotion.app.ui.theme.FamilyMotionTheme
import com.familymotion.app.ui.viewmodel.ExerciseViewModel
import com.familymotion.app.ui.viewmodel.MainViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            FamilyMotionTheme {
                FamilyMotionApp()
            }
        }
    }
}

@Composable
fun FamilyMotionApp() {
    val navController = rememberNavController()
    val mainViewModel: MainViewModel = viewModel()
    val exerciseViewModel: ExerciseViewModel = viewModel()
    val state by mainViewModel.state.collectAsState()

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // 判断是否显示底部导航
    val showBottomBar = currentRoute in listOf(
        Screen.Home.route,
        "exercise_tab",
        Screen.Assessment.route,
        Screen.Profile.route
    )

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    bottomNavItems.forEach { item ->
                        NavigationBarItem(
                            icon = { Icon(item.icon, contentDescription = item.title) },
                            label = { Text(item.title) },
                            selected = when (item) {
                                is com.familymotion.app.ui.navigation.BottomNavItem.Home -> currentRoute == Screen.Home.route
                                is com.familymotion.app.ui.navigation.BottomNavItem.Exercise -> currentRoute == "exercise_tab"
                                is com.familymotion.app.ui.navigation.BottomNavItem.Assessment -> currentRoute == Screen.Assessment.route
                                is com.familymotion.app.ui.navigation.BottomNavItem.Profile -> currentRoute == Screen.Profile.route
                            },
                            onClick = {
                                when (item) {
                                    is com.familymotion.app.ui.navigation.BottomNavItem.Home ->
                                        navController.navigate(Screen.Home.route) {
                                            popUpTo(Screen.Home.route) { inclusive = true }
                                        }
                                    is com.familymotion.app.ui.navigation.BottomNavItem.Exercise ->
                                        navController.navigate("exercise_tab")
                                    is com.familymotion.app.ui.navigation.BottomNavItem.Assessment ->
                                        navController.navigate(Screen.Assessment.route)
                                    is com.familymotion.app.ui.navigation.BottomNavItem.Profile ->
                                        navController.navigate(Screen.Profile.route)
                                }
                            }
                        )
                    }
                }
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier.padding(paddingValues)
        ) {
            // 首页
            composable(Screen.Home.route) {
                HomeScreen(
                    viewModel = mainViewModel,
                    onStartExercise = { planId ->
                        // 获取今日计划或创建临时计划
                        state.todayPlan?.let { plan ->
                            exerciseViewModel.initExercise(plan)
                            navController.navigate(Screen.Exercise.createRoute(plan.id))
                        }
                    },
                    onNavigateToScene = { sceneMode ->
                        val plan = com.familymotion.app.domain.service.PlanRecommendationService()
                            .generateScenePlan(sceneMode)
                        exerciseViewModel.initExercise(plan)
                        navController.navigate(Screen.Exercise.createRoute(plan.id))
                    }
                )
            }

            // 运动标签页
            composable("exercise_tab") {
                // 显示快速运动选择
                ExerciseQuickStartScreen(
                    exercises = mainViewModel.getRecommendedExercises(),
                    onStartExercise = { exercise ->
                        val plan = ExercisePlan(
                            id = "quick_${System.currentTimeMillis()}",
                            title = "快速运动",
                            exercises = listOf(exercise)
                        )
                        exerciseViewModel.initExercise(plan)
                        navController.navigate(Screen.Exercise.createRoute(plan.id))
                    }
                )
            }

            // 运动界面
            composable(
                route = Screen.Exercise.route,
                arguments = listOf(navArgument("planId") { type = NavType.StringType })
            ) {
                ExerciseScreen(
                    plan = state.todayPlan ?: ExercisePlan(),
                    viewModel = exerciseViewModel,
                    onBack = { navController.popBackStack() },
                    onComplete = {
                        navController.popBackStack(Screen.Home.route, false)
                    }
                )
            }

            // 测评界面
            composable(Screen.Assessment.route) {
                AssessmentScreen(
                    onComplete = { result ->
                        mainViewModel.saveAssessmentResult(result)
                        navController.navigate(Screen.AssessmentResult.route)
                    },
                    onBack = { navController.popBackStack() }
                )
            }

            // 测评结果
            composable(Screen.AssessmentResult.route) {
                val result = state.assessmentResults.lastOrNull()
                if (result != null) {
                    AssessmentResultScreen(
                        result = result,
                        onBack = { navController.popBackStack(Screen.Home.route, false) }
                    )
                }
            }

            // 个人中心
            composable(Screen.Profile.route) {
                ProfileScreen(
                    userProfile = state.userProfile,
                    achievements = state.achievements,
                    isPremium = false,
                    onNavigateToParentControl = {
                        navController.navigate(Screen.ParentControl.route)
                    },
                    onNavigateToAssessment = {
                        navController.navigate(Screen.Assessment.route)
                    }
                )
            }

            // 家长控制
            composable(Screen.ParentControl.route) {
                ParentControlScreen(
                    userProfile = state.userProfile,
                    onBack = { navController.popBackStack() }
                )
            }
        }
    }
}

@Composable
fun ExerciseQuickStartScreen(
    exercises: List<com.familymotion.app.data.model.Exercise>,
    onStartExercise: (com.familymotion.app.data.model.Exercise) -> Unit
) {
    var selectedExercise by remember { mutableStateOf<com.familymotion.app.data.model.Exercise?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "快速运动",
            style = MaterialTheme.typography.headlineSmall
        )

        Spacer(modifier = Modifier.padding(16.dp))

        exercises.forEach { exercise ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                onClick = { onStartExercise(exercise) }
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                ) {
                    Text(text = exercise.icon, fontSize = androidx.compose.ui.unit.TextUnit(32f, androidx.compose.ui.unit.TextUnitType.Sp))
                    Spacer(modifier = Modifier.padding(8.dp))
                    Column {
                        Text(text = exercise.name)
                        Text(text = "${exercise.reps}次", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
}
