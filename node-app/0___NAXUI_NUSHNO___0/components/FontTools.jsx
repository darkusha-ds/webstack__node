import React, { useEffect, useState } from 'react'
import { Box, Text, Button, Input, FormGroup } from '@adminjs/design-system'
import { useNotice, withNotice } from 'adminjs'

const FontTools = () => {
  const sendNotice = useNotice()
  const [fontName, setFontName] = useState('')

  useEffect(() => {
    sendNotice({ message: '✅ Тестовое уведомление отображено!', type: 'success' })
  }, [])

  return (
    <Box variant="grey" p="xl" style={{ fontFamily: '"Roboto", sans-serif' }}>
      <Text fontSize="lg" mb="xl">Если вы это видите, компонент точно работает ✅</Text>
      <FormGroup>
        <Input 
          placeholder="Введите название шрифта" 
          value={fontName} 
          onChange={(e) => setFontName(e.target.value)} 
        />
        <Button 
          mt="default"
          variant="primary"
          onClick={async () => {
            const res = await fetch('/admin/api/pages/Fonts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ fontName })
            })
            const json = await res.json()
            if (json.notice) sendNotice(json.notice)
            try {
              await import(fontName)
              sendNotice({ message: `✅ Шрифт ${fontName} загружен!`, type: 'success' })
            } catch (e) {
              sendNotice({ message: `❌ Ошибка загрузки шрифта: ${e.message}`, type: 'error' })
            }
          }}
        >
          Установить
        </Button>
      </FormGroup>
    </Box>
  )
}

export default withNotice(FontTools)