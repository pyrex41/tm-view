module View.Layout exposing (view)

import Html exposing (Html, button, div, h1, header, main_, nav, span, text)
import Html.Attributes exposing (class, classList)
import Html.Events exposing (onClick)
import Types exposing (Model, Msg(..), View(..))
import View.PRDList as PRDList
import View.PRDViewer as PRDViewer
import View.Sidebar as Sidebar
import View.Stats as Stats
import View.TaskDetail as TaskDetail
import View.TaskList as TaskList



-- MAIN VIEW


view : Model -> Html Msg
view model =
    div [ class "app" ]
        [ viewHeader model
        , div [ class "app-body" ]
            [ viewSidebar model
            , viewMainContent model
            ]
        ]



-- HEADER WITH TABS


viewHeader : Model -> Html Msg
viewHeader model =
    header [ class "header" ]
        [ div [ class "header-content" ]
            [ div [ class "header-title" ]
                [ h1 [] [ text "Task Master Viewer" ]
                , span [ class "project-name" ] [ text model.project.name ]
                ]
            , viewTabs model
            , viewContextInfo model
            ]
        ]


viewTabs : Model -> Html Msg
viewTabs model =
    div [ class "tabs" ]
        [ button
            [ classList
                [ ( "tab", True )
                , ( "tab-active", model.currentView == TasksView )
                ]
            , onClick (SwitchView TasksView)
            ]
            [ text "Tasks" ]
        , button
            [ classList
                [ ( "tab", True )
                , ( "tab-active", model.currentView == PRDsView )
                ]
            , onClick (SwitchView PRDsView)
            ]
            [ text "PRDs" ]
        ]


viewContextInfo : Model -> Html Msg
viewContextInfo model =
    div [ class "context-info" ]
        [ span [ class "context-item" ] [ text ("Tag: " ++ "master") ]
        , span [ class "context-item" ] [ text ("Version: " ++ model.project.version) ]
        ]



-- SIDEBAR


viewSidebar : Model -> Html Msg
viewSidebar model =
    nav [ class "sidebar" ]
        [ Sidebar.view model
        , Stats.view model
        ]



-- MAIN CONTENT AREA


viewMainContent : Model -> Html Msg
viewMainContent model =
    main_ [ class "main-content" ]
        [ case model.currentView of
            TasksView ->
                viewTasksPanel model

            PRDsView ->
                viewPRDsPanel model
        ]


viewTasksPanel : Model -> Html Msg
viewTasksPanel model =
    div [ class "content-panels" ]
        [ div [ class "panel panel-list" ]
            [ TaskList.view model
            ]
        , div [ class "panel panel-detail" ]
            [ TaskDetail.view model
            ]
        ]


viewPRDsPanel : Model -> Html Msg
viewPRDsPanel model =
    div [ class "content-panels" ]
        [ div [ class "panel panel-list" ]
            [ PRDList.view model
            ]
        , div [ class "panel panel-detail" ]
            [ PRDViewer.view model
            ]
        ]
