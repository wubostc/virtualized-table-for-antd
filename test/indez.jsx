import { useVT } from '../../platform/src/components/virtual-table/lib/vt'


const EditableCell = (props) => {

  return <td {...props} className={props.posibleNewValues} />
}

const App = () => {
  const [vt, setVt] = useVT(() => {
    return {
      scroll: {
        y: 500
      }
    }
  }, [])

  const convertedLegacyValues = []

  setVt({
      body: {
        cell: (props) => (
          <EditableCell
            {...props}
            posibleNewValues={convertedLegacyValues}
          />
        ),
        row: (...args) => <tr {...args} />,
    }
  })


  return (

  )
}


