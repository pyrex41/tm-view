module View.Header exposing (view)

import Html exposing (Html, div, h1, header, span, text)
import Html.Attributes exposing (class)
import Types exposing (Model)



-- VIEW


view : Model -> Html msg
view model =
    div [ class "app-header" ]
        [ header [ class "header-content" ]
            [ h1 [] [ text "Task Master Viewer" ]
            , span [ class "project-name" ] [ text model.project.name ]
            ]
        , viewContextBar model
        ]



-- CONTEXT BAR


viewContextBar : Model -> Html msg
viewContextBar model =
    div [ class "context-bar" ]
        [ span [ class "context-item" ]
            [ span [ class "context-label" ] [ text "Project:" ]
            , span [ class "context-value" ] [ text model.project.name ]
            ]
        , span [ class "context-item" ]
            [ span [ class "context-label" ] [ text "Tag:" ]
            , span [ class "context-value" ] [ text "master" ] -- TODO: Get actual tag from state
            ]
        , span [ class "context-item" ]
            [ span [ class "context-label" ] [ text "Version:" ]
            , span [ class "context-value" ] [ text model.project.version ]
            ]
        ]
