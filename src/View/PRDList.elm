module View.PRDList exposing (view)

import Html exposing (Html, div, h3, li, span, text, ul)
import Html.Attributes exposing (class)
import Html.Events exposing (onClick)
import Types exposing (Model, Msg(..), PRD)



-- VIEW


view : Model -> Html Msg
view model =
    div [ class "prd-list" ]
        [ h3 [ class "prd-list-title" ] [ text "PRD Documents" ]
        , if List.isEmpty model.prds then
            div [ class "no-prds" ] [ text "No PRD documents found" ]

          else
            ul [ class "prd-items" ]
                (List.map viewPRDItem model.prds)
        ]



-- PRD ITEM VIEW


viewPRDItem : PRD -> Html Msg
viewPRDItem prd =
    li [ class "prd-item", onClick (PRDSelected prd.id) ]
        [ div [ class "prd-item-content" ]
            [ span [ class "prd-title" ] [ text prd.title ]
            , span [ class "prd-meta" ] [ text ("ID: " ++ String.fromInt prd.id) ]
            ]
        ]
