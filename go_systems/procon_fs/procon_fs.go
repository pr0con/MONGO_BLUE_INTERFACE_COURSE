package procon_fs

import(
	"io"
	"os"
	"fmt"
)

func ReadFile(fp string) ([]byte,bool,error) {
	var file, err = os.OpenFile(fp, os.O_RDWR, 0644)
	if err != nil { return []byte(""), false, err }
	
	defer file.Close()
	
	var data = make([]byte, 2048)
	for {
		_, err = file.Read(data)
		
		if err == io.EOF {
			break
		}
		
		if err != nil && err != io.EOF {
			break
		}
	}
	
	fmt.Println("==> done reading file")
	return data,true,nil
}