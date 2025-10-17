module Main exposing (main)

import Api
import Browser
import Html exposing (Html)
import Ports
import Types exposing (..)
import View.Layout as Layout



-- MODEL


init : () -> ( Model, Cmd Msg )
init _ =
    ( { project = { name = "Loading...", description = "", version = "" }
      , tasks = []
      , prds = []
      , stats = { totalTasks = 0, completedTasks = 0, pendingTasks = 0, inProgressTasks = 0 }
      , filters = { status = [], priority = [], search = "" }
      , selectedTask = Nothing
      , expandedTasks = []
      , expandedSubtasksInDetail = []
      , selectedPRD = Nothing
      , prdContent = Nothing
      , currentView = TasksView
      }
    , Cmd.batch
        [ Api.getProject ProjectLoaded
        , Api.getTasksData TasksLoaded
        , Api.getPRDs PRDsLoaded
        , Api.getStats StatsLoaded
        , Ports.setupSSE ()
        ]
    )



-- UPDATE


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ProjectLoaded result ->
            case result of
                Ok project ->
                    ( { model | project = project }, Cmd.none )

                Err _ ->
                    ( model, Cmd.none )

        TasksLoaded result ->
            case result of
                Ok tasks ->
                    ( { model | tasks = tasks }, Cmd.none )

                Err _ ->
                    ( model, Cmd.none )

        PRDsLoaded result ->
            case result of
                Ok prds ->
                    ( { model | prds = prds }, Cmd.none )

                Err _ ->
                    ( model, Cmd.none )

        StatsLoaded result ->
            case result of
                Ok stats ->
                    ( { model | stats = stats }, Cmd.none )

                Err _ ->
                    ( model, Cmd.none )

        TaskSelected taskId ->
            ( { model | selectedTask = taskId }, Cmd.none )

        ToggleTaskExpand taskId ->
            let
                newExpandedTasks =
                    if List.member taskId model.expandedTasks then
                        List.filter (\id -> id /= taskId) model.expandedTasks

                    else
                        taskId :: model.expandedTasks
            in
            ( { model | expandedTasks = newExpandedTasks }, Cmd.none )

        ToggleSubtaskInDetail taskId ->
            let
                newExpandedSubtasks =
                    if List.member taskId model.expandedSubtasksInDetail then
                        List.filter (\id -> id /= taskId) model.expandedSubtasksInDetail

                    else
                        taskId :: model.expandedSubtasksInDetail
            in
            ( { model | expandedSubtasksInDetail = newExpandedSubtasks }, Cmd.none )

        FilterByStatus status isChecked ->
            let
                currentStatuses =
                    model.filters.status

                newStatuses =
                    if isChecked then
                        if List.member status currentStatuses then
                            currentStatuses

                        else
                            status :: currentStatuses

                    else
                        List.filter (\s -> s /= status) currentStatuses

                filters =
                    model.filters

                newFilters =
                    { filters | status = newStatuses }
            in
            ( { model | filters = newFilters }, Cmd.none )

        FilterByPriority priority isChecked ->
            let
                currentPriorities =
                    model.filters.priority

                newPriorities =
                    if isChecked then
                        if List.member priority currentPriorities then
                            currentPriorities

                        else
                            priority :: currentPriorities

                    else
                        List.filter (\p -> p /= priority) currentPriorities

                filters =
                    model.filters

                newFilters =
                    { filters | priority = newPriorities }
            in
            ( { model | filters = newFilters }, Cmd.none )

        SearchUpdated search ->
            let
                filters =
                    model.filters

                newFilters =
                    { filters | search = search }
            in
            ( { model | filters = newFilters }, Cmd.none )

        PRDSelected prdId ->
            ( { model | selectedPRD = Just prdId, prdContent = Nothing }
            , Api.getPRDContent (findPRDTitleById prdId model.prds) PRDContentLoaded
            )

        PRDContentLoaded result ->
            case result of
                Ok content ->
                    ( { model | prdContent = Just content }, Cmd.none )

                Err _ ->
                    ( { model | prdContent = Just "Error loading PRD content" }, Cmd.none )

        MarkdownRendered renderedContent ->
            ( { model | prdContent = Just renderedContent }, Cmd.none )

        SwitchView newView ->
            ( { model | currentView = newView }, Cmd.none )

        HotReloadEvent eventType ->
            case eventType of
                "tasks-updated" ->
                    ( model, Api.getTasksData TasksLoaded )

                "prds-updated" ->
                    ( model, Api.getPRDs PRDsLoaded )

                _ ->
                    ( model, Cmd.none )

        NoOp ->
            ( model, Cmd.none )



-- HELPER FUNCTIONS


findPRDTitleById : Int -> List PRD -> String
findPRDTitleById targetId prds =
    case prds of
        [] ->
            ""

        prd :: rest ->
            if prd.id == targetId then
                prd.title

            else
                findPRDTitleById targetId rest



-- VIEW


view : Model -> Html Msg
view model =
    Layout.view model



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ Ports.markdownRendered MarkdownRendered
        , Ports.sseMessageReceived HotReloadEvent
        ]



-- MAIN


main : Program () Model Msg
main =
    Browser.element
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        }
