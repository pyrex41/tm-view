module View.PRDViewer exposing (view)

import Html exposing (Html, div, h2, p, pre, text)
import Html.Attributes exposing (class)
import Types exposing (Model, Msg(..))



-- VIEW


view : Model -> Html Msg
view model =
    case model.selectedPRD of
        Just prdId ->
            case findPRDById prdId model.prds of
                Just prd ->
                    viewPRDContent model prd

                Nothing ->
                    viewNoSelection

        Nothing ->
            viewNoSelection


viewNoSelection : Html Msg
viewNoSelection =
    div [ class "prd-viewer" ]
        [ div [ class "no-selection" ]
            [ text "Select a PRD document to view its content" ]
        ]



-- PRD CONTENT VIEW


viewPRDContent : Model -> Types.PRD -> Html Msg
viewPRDContent model prd =
    let
        prdData =
            prd
    in
    div [ class "prd-viewer" ]
        [ div [ class "prd-header" ]
            [ h2 [ class "prd-title" ] [ text prdData.title ] ]
        , div [ class "prd-content" ]
            [ case model.prdContent of
                Just content ->
                    pre [ class "prd-text" ] [ text content ]

                Nothing ->
                    div [ class "loading" ] [ text "Loading..." ]
            ]
        ]



-- HELPER FUNCTIONS


findPRDById : Int -> List Types.PRD -> Maybe Types.PRD
findPRDById targetId prds =
    case prds of
        [] ->
            Nothing

        prd :: rest ->
            let
                prdData =
                    prd
            in
            if prdData.id == targetId then
                Just prd

            else
                findPRDById targetId rest
