module View.TaskDetail exposing (view)

import Html exposing (Html, div, h2, h3, li, p, span, text, ul)
import Html.Attributes exposing (class, classList)
import Html.Events exposing (onClick, stopPropagationOn)
import Json.Decode as Decode
import Types exposing (Model, Msg(..), Priority(..), Status(..), Task(..))
import Utils.Task as TaskUtils



-- VIEW


view : Model -> Html Msg
view model =
    case model.selectedTask of
        Nothing ->
            div [ class "task-detail-empty" ]
                [ div [ class "empty-state" ]
                    [ text "Select a task to view details" ]
                ]

        Just taskId ->
            case TaskUtils.findTaskById taskId model.tasks of
                Nothing ->
                    div [ class "task-detail-empty" ]
                        [ div [ class "empty-state" ]
                            [ text "Task not found" ]
                        ]

                Just task ->
                    viewTaskDetail model task


viewTaskDetail : Model -> Task -> Html Msg
viewTaskDetail model task =
    let
        (Task taskData) =
            task
    in
    div [ class "task-detail" ]
        [ -- Header
          div [ class "task-detail-header" ]
            [ div [ class "task-title-row" ]
                [ h2 [] [ text taskData.title ]
                , span [ class "task-id-badge" ] [ text ("#" ++ taskData.id) ]
                ]
            , div [ class "task-badges" ]
                [ viewStatusBadge taskData.status
                , viewPriorityBadge taskData.priority
                ]
            ]
        , -- Content
          div [ class "task-detail-content" ]
            [ if not (String.isEmpty taskData.description) then
                viewSection "Description" taskData.description

              else
                text ""
            , if not (String.isEmpty taskData.details) then
                viewSection "Details" taskData.details

              else
                text ""
            , if not (String.isEmpty taskData.testStrategy) then
                viewSection "Test Strategy" taskData.testStrategy

              else
                text ""
            , if not (List.isEmpty taskData.dependencies) then
                div [ class "task-section" ]
                    [ h3 [] [ text "Dependencies" ]
                    , div [ class "dependencies-list" ]
                        [ text (String.join ", " (List.map (\id -> "#" ++ id) taskData.dependencies)) ]
                    ]

              else
                text ""
            , if not (List.isEmpty taskData.subtasks) then
                div [ class "task-section" ]
                    [ h3 [] [ text "Subtasks" ]
                    , div [ class "detail-subtasks" ]
                        [ ul [ class "detail-subtask-tree" ]
                            (List.map (viewSubtaskExpandable model 0) taskData.subtasks)
                        ]
                    ]

              else
                text ""
            ]
        ]


viewSection : String -> String -> Html Msg
viewSection title content =
    div [ class "task-section" ]
        [ h3 [] [ text title ]
        , p [] [ text content ]
        ]


viewSubtaskExpandable : Model -> Int -> Task -> Html Msg
viewSubtaskExpandable model depth task =
    let
        (Task taskData) =
            task

        isExpanded =
            List.member taskData.id model.expandedSubtasksInDetail

        isSelected =
            model.selectedTask == Just taskData.id

        hasSubtasks =
            not (List.isEmpty taskData.subtasks)
    in
    li [ class "detail-subtask-item" ]
        [ div
            [ classList
                [ ( "detail-subtask-row", True )
                , ( "subtask-depth-" ++ String.fromInt depth, True )
                , ( "subtask-selected", isSelected )
                ]
            , onClick (TaskSelected (Just taskData.id))
            ]
            [ if hasSubtasks then
                span
                    [ class "subtask-expand-icon"
                    , stopPropagationOn "click" (Decode.succeed ( ToggleSubtaskInDetail taskData.id, True ))
                    ]
                    [ text
                        (if isExpanded then
                            "▼"

                         else
                            "▶"
                        )
                    ]

              else
                span [ class "subtask-expand-icon subtask-expand-placeholder" ] [ text "" ]
            , span [ class "subtask-id" ] [ text ("#" ++ taskData.id) ]
            , span [ class "subtask-title" ] [ text taskData.title ]
            , viewStatusBadge taskData.status
            ]
        , if hasSubtasks && isExpanded then
            ul [ class "detail-subtask-tree nested" ]
                (List.map (viewSubtaskExpandable model (depth + 1)) taskData.subtasks)

          else
            text ""
        ]



-- BADGES


viewStatusBadge : Status -> Html Msg
viewStatusBadge status =
    let
        statusClass =
            case status of
                Pending ->
                    "status-pending"

                InProgress ->
                    "status-in-progress"

                Done ->
                    "status-done"

                Deferred ->
                    "status-deferred"

                Cancelled ->
                    "status-cancelled"

        statusText =
            case status of
                Pending ->
                    "pending"

                InProgress ->
                    "in progress"

                Done ->
                    "done"

                Deferred ->
                    "deferred"

                Cancelled ->
                    "cancelled"
    in
    span [ class ("badge status-badge " ++ statusClass) ] [ text statusText ]


viewPriorityBadge : Priority -> Html Msg
viewPriorityBadge priority =
    let
        priorityClass =
            case priority of
                High ->
                    "priority-high"

                Medium ->
                    "priority-medium"

                Low ->
                    "priority-low"

        priorityText =
            case priority of
                High ->
                    "high"

                Medium ->
                    "medium"

                Low ->
                    "low"
    in
    span [ class ("badge priority-badge " ++ priorityClass) ] [ text priorityText ]
