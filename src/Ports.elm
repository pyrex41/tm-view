port module Ports exposing (..)

import Types exposing (PRD)



-- OUTGOING PORTS (Elm to JavaScript)


port renderMarkdown : String -> Cmd msg


port setupSSE : () -> Cmd msg



-- INCOMING PORTS (JavaScript to Elm)


port markdownRendered : (String -> msg) -> Sub msg


port sseMessageReceived : (String -> msg) -> Sub msg
