package procon_data

import(
	"fmt"
	
	"github.com/gorilla/websocket"
)

type MsgIn struct {
	Jwt string  `json:"jwt"`
	Type string `json:"type"`
	Data string `json:"data"`
}

type MsgOut struct {
	Type string `json:"type"`
	Data string `json:"data"`
}

func SendMsg(t string, d string, c *websocket.Conn) {
	m := MsgOut{t,d}
		
	if err := c.WriteJSON(m); err != nil {
		fmt.Println(err)
	}
}

type BypassTokenRecord struct {
	Wsid string `json:"wsid"`
	Exp float64 `json:"exp"`
}
