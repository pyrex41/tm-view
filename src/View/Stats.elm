module View.Stats exposing (view)

import Html exposing (Html, div, h3, p, span, text)
import Html.Attributes exposing (class)
import Types exposing (Model, Stats)



-- VIEW


view : Model -> Html msg
view model =
    div [ class "stats-dashboard" ]
        [ h3 [ class "stats-title" ] [ text "Task Statistics" ]
        , div [ class "stats-grid" ]
            [ viewTotalStats model.stats
            , viewStatusStats model.stats
            , viewPriorityStats model.stats
            ]
        ]



-- TOTAL STATS


viewTotalStats : Stats -> Html msg
viewTotalStats stats =
    div [ class "stat-card" ]
        [ div [ class "stat-header" ]
            [ span [ class "stat-label" ] [ text "Total Tasks" ]
            , span [ class "stat-value" ] [ text (String.fromInt stats.totalTasks) ]
            ]
        ]



-- STATUS STATS


viewStatusStats : Stats -> Html msg
viewStatusStats stats =
    div [ class "stat-card" ]
        [ div [ class "stat-header" ]
            [ span [ class "stat-label" ] [ text "By Status" ] ]
        , div [ class "stat-breakdown" ]
            [ div [ class "stat-item" ]
                [ span [ class "stat-item-label" ] [ text "Pending" ]
                , span [ class "stat-item-value" ] [ text (String.fromInt stats.pendingTasks) ]
                ]
            , div [ class "stat-item" ]
                [ span [ class "stat-item-label" ] [ text "In Progress" ]
                , span [ class "stat-item-value" ] [ text (String.fromInt stats.inProgressTasks) ]
                ]
            , div [ class "stat-item" ]
                [ span [ class "stat-item-label" ] [ text "Done" ]
                , span [ class "stat-item-value" ] [ text (String.fromInt stats.completedTasks) ]
                ]
            ]
        ]



-- PRIORITY STATS


viewPriorityStats : Stats -> Html msg
viewPriorityStats stats =
    div [ class "stat-card" ]
        [ div [ class "stat-header" ]
            [ span [ class "stat-label" ] [ text "By Priority" ] ]
        , div [ class "stat-breakdown" ]
            [ div [ class "stat-item" ]
                [ span [ class "stat-item-label" ] [ text "High" ]
                , span [ class "stat-item-value" ] [ text "0" ] -- TODO: Add priority stats to Stats type
                ]
            , div [ class "stat-item" ]
                [ span [ class "stat-item-label" ] [ text "Medium" ]
                , span [ class "stat-item-value" ] [ text "0" ] -- TODO: Add priority stats to Stats type
                ]
            , div [ class "stat-item" ]
                [ span [ class "stat-item-label" ] [ text "Low" ]
                , span [ class "stat-item-value" ] [ text "0" ] -- TODO: Add priority stats to Stats type
                ]
            ]
        ]
