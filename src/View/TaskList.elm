module View.TaskList exposing (view)

import Html exposing (Html, div, h2, li, span, text, ul)
import Html.Attributes exposing (class, classList)
import Html.Events exposing (onClick, stopPropagationOn)
import Json.Decode as Decode
import Types exposing (Model, Msg(..), Priority(..), Status(..), Task(..))
import Utils.Task as TaskUtils



-- VIEW


view : Model -> Html Msg
view model =
    let
        filteredTasks =
            TaskUtils.filterTasks model.filters model.tasks

        taskCount =
            List.length filteredTasks
    in
    div [ class "task-list" ]
        [ div [ class "task-list-header" ]
            [ h2 [] [ text "Tasks" ]
            , span [ class "task-count" ] [ text (String.fromInt taskCount ++ " tasks") ]
            ]
        , div [ class "task-list-content" ]
            [ if List.isEmpty filteredTasks then
                div [ class "empty-state" ]
                    [ text "No tasks match your filters" ]

              else
                ul [ class "task-tree" ]
                    (List.map (viewTask model 0) filteredTasks)
            ]
        ]



-- TASK ITEM


viewTask : Model -> Int -> Task -> Html Msg
viewTask model depth task =
    let
        (Task taskData) =
            task

        isExpanded =
            List.member taskData.id model.expandedTasks

        isSelected =
            model.selectedTask == Just taskData.id

        hasSubtasks =
            not (List.isEmpty taskData.subtasks)
    in
    li [ class "task-item" ]
        [ div
            [ classList
                [ ( "task-row", True )
                , ( "task-selected", isSelected )
                , ( "task-depth-" ++ String.fromInt depth, True )
                ]
            , onClick (TaskSelected (Just taskData.id))
            ]
            [ if hasSubtasks then
                span
                    [ class "task-expand-icon"
                    , stopPropagationOn "click" (Decode.succeed ( ToggleTaskExpand taskData.id, True ))
                    ]
                    [ text
                        (if isExpanded then
                            "▼"

                         else
                            "▶"
                        )
                    ]

              else
                span [ class "task-expand-icon task-expand-placeholder" ] [ text "" ]
            , span [ class "task-id" ] [ text ("#" ++ taskData.id) ]
            , span [ class "task-title" ] [ text taskData.title ]
            , viewStatusBadge taskData.status
            , viewPriorityBadge taskData.priority
            ]
        , if hasSubtasks && isExpanded then
            ul [ class "task-subtree" ]
                (List.map (viewTask model (depth + 1)) taskData.subtasks)

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
