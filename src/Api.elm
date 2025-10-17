module Api exposing (..)

import Http
import Json.Decode as Decode exposing (Decoder)
import Types exposing (..)



-- API ENDPOINT BASE URL


baseUrl : String
baseUrl =
    "/api"



-- DECODERS FOR API RESPONSES


projectResponseDecoder : Decoder Project
projectResponseDecoder =
    Decode.field "config" configDecoder
        |> Decode.andThen
            (\config ->
                Decode.succeed
                    { name = config.name
                    , description = config.description
                    , version = config.version
                    }
            )


configDecoder : Decoder { name : String, description : String, version : String }
configDecoder =
    Decode.map3 (\name desc ver -> { name = name, description = desc, version = ver })
        (Decode.oneOf [ Decode.field "projectName" Decode.string, Decode.succeed "Task Master" ])
        (Decode.oneOf [ Decode.field "projectDescription" Decode.string, Decode.succeed "Task Management System" ])
        (Decode.oneOf [ Decode.field "projectVersion" Decode.string, Decode.succeed "1.0.0" ])


tasksResponseDecoder : Decoder (List Task)
tasksResponseDecoder =
    Decode.field "format" Decode.string
        |> Decode.andThen
            (\format ->
                case format of
                    "tagged" ->
                        -- Tagged format: tasks.master.tasks
                        Decode.at [ "tasks", "master", "tasks" ] (Decode.list taskDecoder)

                    "legacy" ->
                        -- Legacy format: tasks
                        Decode.field "tasks" (Decode.list taskDecoder)

                    _ ->
                        Decode.succeed []
            )


prdsResponseDecoder : Decoder (List PRD)
prdsResponseDecoder =
    Decode.field "prds" (Decode.list prdItemDecoder)
        |> Decode.map (List.indexedMap (\idx prd -> { prd | id = idx }))


prdItemDecoder : Decoder PRD
prdItemDecoder =
    Decode.map3 PRD
        (Decode.succeed 0)
        (Decode.field "name" Decode.string)
        (Decode.succeed "")


prdContentResponseDecoder : Decoder String
prdContentResponseDecoder =
    Decode.field "content" Decode.string


statsResponseDecoder : Decoder Stats
statsResponseDecoder =
    Decode.map4 Stats
        (Decode.field "total" Decode.int)
        (Decode.at [ "byStatus", "done" ] Decode.int |> Decode.maybe |> Decode.map (Maybe.withDefault 0))
        (Decode.at [ "byStatus", "pending" ] Decode.int |> Decode.maybe |> Decode.map (Maybe.withDefault 0))
        (Decode.at [ "byStatus", "in-progress" ] Decode.int |> Decode.maybe |> Decode.map (Maybe.withDefault 0))



-- HTTP REQUEST FUNCTIONS


getProject : (Result Http.Error Project -> msg) -> Cmd msg
getProject toMsg =
    Http.get
        { url = baseUrl ++ "/project"
        , expect = Http.expectJson toMsg projectResponseDecoder
        }


getTasksData : (Result Http.Error (List Task) -> msg) -> Cmd msg
getTasksData toMsg =
    Http.get
        { url = baseUrl ++ "/tasks"
        , expect = Http.expectJson toMsg tasksResponseDecoder
        }


getTasksForTag : String -> (Result Http.Error (List Task) -> msg) -> Cmd msg
getTasksForTag tag toMsg =
    Http.get
        { url = baseUrl ++ "/tasks/" ++ tag
        , expect = Http.expectJson toMsg tasksResponseDecoder
        }


getPRDs : (Result Http.Error (List PRD) -> msg) -> Cmd msg
getPRDs toMsg =
    Http.get
        { url = baseUrl ++ "/prds"
        , expect = Http.expectJson toMsg prdsResponseDecoder
        }


getPRDContent : String -> (Result Http.Error String -> msg) -> Cmd msg
getPRDContent filename toMsg =
    Http.get
        { url = baseUrl ++ "/prds/" ++ filename
        , expect = Http.expectJson toMsg prdContentResponseDecoder
        }


getStats : (Result Http.Error Stats -> msg) -> Cmd msg
getStats toMsg =
    Http.get
        { url = baseUrl ++ "/stats"
        , expect = Http.expectJson toMsg statsResponseDecoder
        }
