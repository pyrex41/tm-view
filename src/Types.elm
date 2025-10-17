module Types exposing (..)

import Http
import Json.Decode as Decode exposing (Decoder)
import Json.Decode.Pipeline exposing (optional, required)



-- STATUS AND PRIORITY TYPES


type Status
    = Pending
    | InProgress
    | Done
    | Deferred
    | Cancelled


type Priority
    = High
    | Medium
    | Low



-- TASK DATA TYPE


type Task
    = Task
        { id : String
        , title : String
        , description : String
        , details : String
        , testStrategy : String
        , priority : Priority
        , dependencies : List String
        , status : Status
        , subtasks : List Task
        }



-- MODEL TYPE ALIAS


type alias Project =
    { name : String
    , description : String
    , version : String
    }


type alias PRD =
    { id : Int
    , title : String
    , content : String
    }


type alias Stats =
    { totalTasks : Int
    , completedTasks : Int
    , pendingTasks : Int
    , inProgressTasks : Int
    }


type alias Filters =
    { status : List Status
    , priority : List Priority
    , search : String
    }


type View
    = TasksView
    | PRDsView


type alias Model =
    { project : Project
    , tasks : List Task
    , prds : List PRD
    , stats : Stats
    , filters : Filters
    , selectedTask : Maybe String
    , expandedTasks : List String
    , expandedSubtasksInDetail : List String
    , selectedPRD : Maybe Int
    , prdContent : Maybe String
    , currentView : View
    }



-- MSG UNION TYPE


type Msg
    = ProjectLoaded (Result Http.Error Project)
    | TasksLoaded (Result Http.Error (List Task))
    | PRDsLoaded (Result Http.Error (List PRD))
    | StatsLoaded (Result Http.Error Stats)
    | TaskSelected (Maybe String)
    | ToggleTaskExpand String
    | ToggleSubtaskInDetail String
    | FilterByStatus Status Bool
    | FilterByPriority Priority Bool
    | SearchUpdated String
    | PRDSelected Int
    | PRDContentLoaded (Result Http.Error String)
    | MarkdownRendered String
    | SwitchView View
    | HotReloadEvent String
    | NoOp



-- TYPE SAFETY UTILITIES


statusToString : Status -> String
statusToString status =
    case status of
        Pending ->
            "pending"

        InProgress ->
            "in-progress"

        Done ->
            "done"

        Deferred ->
            "deferred"

        Cancelled ->
            "cancelled"


priorityToString : Priority -> String
priorityToString priority =
    case priority of
        High ->
            "high"

        Medium ->
            "medium"

        Low ->
            "low"



-- JSON DECODERS


statusDecoder : Decoder Status
statusDecoder =
    Decode.string
        |> Decode.andThen
            (\str ->
                case str of
                    "pending" ->
                        Decode.succeed Pending

                    "in-progress" ->
                        Decode.succeed InProgress

                    "done" ->
                        Decode.succeed Done

                    "deferred" ->
                        Decode.succeed Deferred

                    "cancelled" ->
                        Decode.succeed Cancelled

                    _ ->
                        Decode.succeed Pending
            )


priorityDecoder : Decoder Priority
priorityDecoder =
    Decode.string
        |> Decode.andThen
            (\str ->
                case str of
                    "high" ->
                        Decode.succeed High

                    "medium" ->
                        Decode.succeed Medium

                    "low" ->
                        Decode.succeed Low

                    _ ->
                        Decode.succeed Medium
            )


taskDecoder : Decoder Task
taskDecoder =
    Decode.succeed
        (\id title description details testStrategy priority dependencies status subtasks ->
            Task
                { id = id
                , title = title
                , description = description
                , details = details
                , testStrategy = testStrategy
                , priority = priority
                , dependencies = dependencies
                , status = status
                , subtasks = subtasks
                }
        )
        |> required "id" idDecoder
        |> required "title" Decode.string
        |> optional "description" Decode.string ""
        |> optional "details" Decode.string ""
        |> optional "testStrategy" Decode.string ""
        |> optional "priority" priorityDecoder Medium
        |> optional "dependencies" (Decode.list idDecoder) []
        |> optional "status" statusDecoder Pending
        |> optional "subtasks" (Decode.list (Decode.lazy (\_ -> taskDecoder))) []


idDecoder : Decoder String
idDecoder =
    Decode.oneOf
        [ Decode.string
        , Decode.int |> Decode.map String.fromInt
        ]


projectDecoder : Decoder Project
projectDecoder =
    Decode.succeed Project
        |> required "name" Decode.string
        |> required "description" Decode.string
        |> required "version" Decode.string


prdDecoder : Decoder PRD
prdDecoder =
    Decode.succeed PRD
        |> required "id" Decode.int
        |> required "title" Decode.string
        |> required "content" Decode.string


statsDecoder : Decoder Stats
statsDecoder =
    Decode.succeed Stats
        |> required "totalTasks" Decode.int
        |> required "completedTasks" Decode.int
        |> required "pendingTasks" Decode.int
        |> required "inProgressTasks" Decode.int
