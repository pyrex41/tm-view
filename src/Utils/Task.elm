module Utils.Task exposing (filterTasks, findTaskById)

import Types exposing (Filters, Priority(..), Status(..), Task(..))



-- FILTER TASKS


filterTasks : Filters -> List Task -> List Task
filterTasks filters tasks =
    tasks
        |> List.filter (matchesFilters filters)
        |> List.map (filterSubtasks filters)


matchesFilters : Filters -> Task -> Bool
matchesFilters filters task =
    let
        (Task taskData) =
            task

        matchesSearch =
            if String.isEmpty filters.search then
                True

            else
                let
                    searchLower =
                        String.toLower filters.search

                    titleMatch =
                        String.contains searchLower (String.toLower taskData.title)

                    descMatch =
                        String.contains searchLower (String.toLower taskData.description)
                in
                titleMatch || descMatch || matchesSearchInSubtasks filters.search taskData.subtasks

        matchesStatus =
            if List.isEmpty filters.status then
                True

            else
                List.member taskData.status filters.status

        matchesPriority =
            if List.isEmpty filters.priority then
                True

            else
                List.member taskData.priority filters.priority
    in
    matchesSearch && matchesStatus && matchesPriority


matchesSearchInSubtasks : String -> List Task -> Bool
matchesSearchInSubtasks search subtasks =
    List.any
        (\task ->
            let
                (Task taskData) =
                    task

                searchLower =
                    String.toLower search
            in
            String.contains searchLower (String.toLower taskData.title)
                || String.contains searchLower (String.toLower taskData.description)
                || matchesSearchInSubtasks search taskData.subtasks
        )
        subtasks


filterSubtasks : Filters -> Task -> Task
filterSubtasks filters task =
    let
        (Task taskData) =
            task

        filteredSubtasks =
            taskData.subtasks
                |> List.filter (matchesFilters filters)
                |> List.map (filterSubtasks filters)
    in
    Task { taskData | subtasks = filteredSubtasks }



-- FIND TASK BY ID


findTaskById : String -> List Task -> Maybe Task
findTaskById targetId tasks =
    case tasks of
        [] ->
            Nothing

        task :: rest ->
            let
                (Task taskData) =
                    task
            in
            if taskData.id == targetId then
                Just task

            else
                case findTaskById targetId taskData.subtasks of
                    Just found ->
                        Just found

                    Nothing ->
                        findTaskById targetId rest
