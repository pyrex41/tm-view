module View.Sidebar exposing (view)

import Html exposing (Html, div, h3, input, label, text)
import Html.Attributes exposing (checked, class, placeholder, type_, value)
import Html.Events exposing (onCheck, onInput)
import Types exposing (Filters, Model, Msg(..), Priority(..), Status(..))



-- VIEW


view : Model -> Html Msg
view model =
    div [ class "sidebar-filters" ]
        [ viewSearchFilter model.filters.search
        , viewStatusFilters model.filters
        , viewPriorityFilters model.filters
        ]



-- SEARCH


viewSearchFilter : String -> Html Msg
viewSearchFilter searchText =
    div [ class "filter-section" ]
        [ h3 [] [ text "SEARCH" ]
        , input
            [ type_ "text"
            , class "search-input"
            , placeholder "Search tasks..."
            , value searchText
            , onInput SearchUpdated
            ]
            []
        ]



-- STATUS FILTERS


viewStatusFilters : Filters -> Html Msg
viewStatusFilters filters =
    div [ class "filter-section" ]
        [ h3 [] [ text "STATUS" ]
        , div [ class "filter-options" ]
            [ viewStatusCheckbox filters Pending "Pending"
            , viewStatusCheckbox filters InProgress "In Progress"
            , viewStatusCheckbox filters Done "Done"
            , viewStatusCheckbox filters Deferred "Deferred"
            , viewStatusCheckbox filters Cancelled "Cancelled"
            ]
        ]


viewStatusCheckbox : Filters -> Status -> String -> Html Msg
viewStatusCheckbox filters status labelText =
    label [ class "filter-checkbox" ]
        [ input
            [ type_ "checkbox"
            , checked (List.member status filters.status)
            , onCheck (FilterByStatus status)
            ]
            []
        , text labelText
        ]



-- PRIORITY FILTERS


viewPriorityFilters : Filters -> Html Msg
viewPriorityFilters filters =
    div [ class "filter-section" ]
        [ h3 [] [ text "PRIORITY" ]
        , div [ class "filter-options" ]
            [ viewPriorityCheckbox filters High "High"
            , viewPriorityCheckbox filters Medium "Medium"
            , viewPriorityCheckbox filters Low "Low"
            ]
        ]


viewPriorityCheckbox : Filters -> Priority -> String -> Html Msg
viewPriorityCheckbox filters priority labelText =
    label [ class "filter-checkbox" ]
        [ input
            [ type_ "checkbox"
            , checked (List.member priority filters.priority)
            , onCheck (FilterByPriority priority)
            ]
            []
        , text labelText
        ]
